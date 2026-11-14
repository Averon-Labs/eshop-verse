<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * PRF-001: server-side storage for customer profile photos.
 *
 * Files live on the `profile-images` disk (storage/app/profile-images),
 * outside the web root, flat under a generated UUID name and served by
 * GET /api/v1/media/profile-images/{filename}. Serving through the API keeps
 * one working path on every supported host layout: a published public
 * directory as well as the shared-origin layout where only /api/* reaches
 * the front controller.
 *
 * The generated name is an unguessable capability and the route exposes no
 * customer identifier. The MySQL row stores only that name, so the absolute
 * URL can change with the host without a data migration.
 */
class ProfileImageStorage
{
    /** Filesystem disk holding the uploaded files (config/filesystems.php). */
    public const DISK = 'profile-images';

    /** Upload ceiling in kilobytes (matches the contract's 5 MB limit). */
    public const MAX_KILOBYTES = 5120;

    /**
     * Accepted extensions => MIME type. The upload rule validates by MIME
     * content (`mimes:`); this maps the stored name back to a content type
     * when the file is served.
     *
     * @var array<string, string>
     */
    private const MIME_TYPES = [
        'jpg' => 'image/jpeg',
        'png' => 'image/png',
        'webp' => 'image/webp',
    ];

    /**
     * Store one validated upload under a generated name and return that name.
     * The client-supplied name is never used, so it cannot influence the path.
     */
    public function store(UploadedFile $file): ?string
    {
        $extension = $this->extensionFor($file);

        if ($extension === null) {
            return null;
        }

        $filename = Str::uuid()->toString().'.'.$extension;

        $stored = Storage::disk(self::DISK)->putFileAs('', $file, $filename);

        if ($stored === false) {
            Log::error('Profile photo upload failed: storage/app/profile-images is not writable.', [
                'extension' => $extension,
            ]);

            return null;
        }

        return $filename;
    }

    /**
     * Delete one stored file by its stored name. Anything that is not a safe
     * plain file name is ignored, so a malformed row cannot escape the disk.
     */
    public function delete(?string $path): void
    {
        if (! is_string($path) || ! $this->isSafeFilename($path)) {
            return;
        }

        Storage::disk(self::DISK)->delete($path);
    }

    /** Absolute public URL for a stored file name, or null when absent. */
    public function urlFor(?string $path): ?string
    {
        if (! is_string($path) || $path === '' || ! $this->isSafeFilename($path)) {
            return null;
        }

        return route('media.profile-images', ['filename' => $path]);
    }

    /** Whether a requested file name may be served (no path traversal). */
    public function isSafeFilename(string $filename): bool
    {
        return preg_match('/^[A-Za-z0-9][A-Za-z0-9._-]{0,120}$/', $filename) === 1;
    }

    /** MIME type for a stored file name, derived from its extension. */
    public function mimeTypeFor(string $filename): string
    {
        $extension = strtolower(pathinfo($filename, PATHINFO_EXTENSION));

        return self::MIME_TYPES[$extension] ?? 'application/octet-stream';
    }

    /** Allowed extension for an upload, normalized to the stored form. */
    private function extensionFor(UploadedFile $file): ?string
    {
        $extension = strtolower((string) $file->guessExtension());

        if ($extension === 'jpeg') {
            $extension = 'jpg';
        }

        return array_key_exists($extension, self::MIME_TYPES) ? $extension : null;
    }
}
