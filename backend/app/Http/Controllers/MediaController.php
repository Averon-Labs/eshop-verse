<?php

namespace App\Http\Controllers;

use App\Exceptions\ApiException;
use App\Services\ProductImageStorage;
use App\Services\ProfileImageStorage;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Storage;

/**
 * CAT-003 / PRF-001: serves uploaded product images and customer profile
 * photos from storage.
 *
 * The files live outside the web root, so every host serves them through
 * these operations regardless of its document-root layout. Reads are public:
 * product images are catalog data, and profile photos use an unguessable
 * generated name that exposes no customer identifier. Both are governed by
 * the document-level `global` rate-limit class.
 */
class MediaController extends Controller
{
    public function __construct(
        private readonly ProductImageStorage $images,
        private readonly ProfileImageStorage $profileImages,
    ) {}

    /**
     * GET /media/product-images/{productId}/{filename} — one stored image.
     */
    public function productImage(int $productId, string $filename): Response
    {
        // Route constraint already rejects traversal; keep the same check on
        // the value that reaches the disk so only a plain name is ever read.
        if (! $this->images->isSafeFilename($filename)) {
            throw new ApiException(404, 'NOT_FOUND', 'The requested image was not found.');
        }

        $disk = Storage::disk(ProductImageStorage::DISK);
        $path = $productId.'/'.$filename;

        if (! $disk->exists($path)) {
            throw new ApiException(404, 'NOT_FOUND', 'The requested image was not found.');
        }

        $contents = $disk->get($path);

        if (! is_string($contents)) {
            throw new ApiException(404, 'NOT_FOUND', 'The requested image was not found.');
        }

        return response($contents, 200, [
            'Content-Type' => $this->images->mimeTypeFor($filename),
            'Content-Length' => (string) strlen($contents),
            'Content-Disposition' => 'inline; filename="'.$filename.'"',
            // Images are immutable (generated names), so they are safe to cache.
            'Cache-Control' => 'public, max-age=604800',
        ]);
    }

    /**
     * GET /media/profile-images/{filename} — one stored profile photo.
     */
    public function profileImage(string $filename): Response
    {
        // Route constraint already rejects traversal; keep the same check on
        // the value that reaches the disk so only a plain name is ever read.
        if (! $this->profileImages->isSafeFilename($filename)) {
            throw new ApiException(404, 'NOT_FOUND', 'The requested image was not found.');
        }

        $disk = Storage::disk(ProfileImageStorage::DISK);

        if (! $disk->exists($filename)) {
            throw new ApiException(404, 'NOT_FOUND', 'The requested image was not found.');
        }

        $contents = $disk->get($filename);

        if (! is_string($contents)) {
            throw new ApiException(404, 'NOT_FOUND', 'The requested image was not found.');
        }

        return response($contents, 200, [
            'Content-Type' => $this->profileImages->mimeTypeFor($filename),
            'Content-Length' => (string) strlen($contents),
            'Content-Disposition' => 'inline; filename="'.$filename.'"',
            // Replacement always writes a new name, so a stored file never changes.
            'Cache-Control' => 'public, max-age=604800',
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }
}
