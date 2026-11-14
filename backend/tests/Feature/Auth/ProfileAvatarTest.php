<?php

namespace Tests\Feature\Auth;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Testing\TestResponse;
use Tests\TestCase;

/**
 * PRF-001: customer profile-photo upload, replacement, deletion, validation,
 * ownership isolation, and the public media read.
 */
class ProfileAvatarTest extends TestCase
{
    use RefreshDatabase;

    /** Minimal valid 1x1 PNG; fileinfo detects it from the real bytes. */
    private const PNG_BYTES = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('profile-images');
    }

    public function test_avatar_upload_stores_the_file_and_returns_its_url(): void
    {
        [$userId, $token] = $this->registerCustomer();

        $response = $this->upload($token, $this->png('face.png'));

        $response->assertOk()
            ->assertJsonStructure(['data' => ['id', 'firstName', 'avatarUrl']]);

        $url = (string) $response->json('data.avatarUrl');
        $filename = basename($url);

        $this->assertStringContainsString('/api/v1/media/profile-images/', $url);
        $this->assertDatabaseHas('users', ['id' => $userId, 'avatar_path' => $filename]);
        Storage::disk('profile-images')->assertExists($filename);

        $this->get('/api/v1/media/profile-images/'.$filename)
            ->assertOk()
            ->assertHeader('Content-Type', 'image/png');
    }

    public function test_avatar_replacement_removes_the_previous_file(): void
    {
        [, $token] = $this->registerCustomer();

        $first = basename((string) $this->upload($token, $this->png('one.png'))->json('data.avatarUrl'));
        $second = basename((string) $this->upload($token, $this->png('two.png'))->json('data.avatarUrl'));

        $this->assertNotSame($first, $second);
        Storage::disk('profile-images')->assertMissing($first);
        Storage::disk('profile-images')->assertExists($second);
        $this->assertCount(1, Storage::disk('profile-images')->allFiles(''));
    }

    public function test_avatar_delete_removes_the_file_and_is_idempotent(): void
    {
        [$userId, $token] = $this->registerCustomer();

        $filename = basename((string) $this->upload($token, $this->png('gone.png'))->json('data.avatarUrl'));

        $this->withToken($token)
            ->deleteJson('/api/v1/auth/profile/avatar')
            ->assertNoContent();

        $this->assertDatabaseHas('users', ['id' => $userId, 'avatar_path' => null]);
        Storage::disk('profile-images')->assertMissing($filename);
        $this->get('/api/v1/media/profile-images/'.$filename)->assertStatus(404);

        // The second call still answers 204: DELETE is idempotent.
        $this->withToken($token)
            ->deleteJson('/api/v1/auth/profile/avatar')
            ->assertNoContent();
    }

    public function test_avatar_endpoints_require_authentication(): void
    {
        $this->assertApiError(
            $this->post('/api/v1/auth/profile/avatar', ['image' => $this->png('anon.png')], ['Accept' => 'application/json']),
            401,
            'UNAUTHENTICATED',
        );

        $this->assertApiError(
            $this->deleteJson('/api/v1/auth/profile/avatar'),
            401,
            'UNAUTHENTICATED',
        );

        $this->assertCount(0, Storage::disk('profile-images')->allFiles(''));
    }

    public function test_avatar_upload_rejects_a_non_image_and_oversized_files(): void
    {
        [, $token] = $this->registerCustomer();

        $script = $this->tempFile('evil.png', "<?php echo 'not an image';");
        $this->assertApiError($this->upload($token, $script), 422, 'VALIDATION_ERROR');

        $oversized = $this->tempFile(
            'huge.png',
            base64_decode(self::PNG_BYTES).str_repeat("\0", (6 * 1024 * 1024)),
        );
        $this->assertApiError($this->upload($token, $oversized), 422, 'VALIDATION_ERROR');

        // Missing file field is reported against the image field.
        $this->assertApiError(
            $this->post('/api/v1/auth/profile/avatar', [], $this->headers($token)),
            422,
            'VALIDATION_ERROR',
        );

        $this->assertCount(0, Storage::disk('profile-images')->allFiles(''));
    }

    public function test_avatar_is_private_to_the_customer_who_uploaded_it(): void
    {
        [$firstId, $firstToken] = $this->registerCustomer();
        [$secondId, $secondToken] = $this->registerCustomer([
            'email' => 'second@example.com',
        ]);

        $firstUrl = (string) $this->upload($firstToken, $this->png('first.png'))->json('data.avatarUrl');
        $secondUrl = (string) $this->upload($secondToken, $this->png('second.png'))->json('data.avatarUrl');

        $this->assertNotSame($firstUrl, $secondUrl);

        $this->withToken($secondToken)
            ->deleteJson('/api/v1/auth/profile/avatar')
            ->assertNoContent();

        // Deleting the second customer's photo leaves the first one untouched.
        $this->assertDatabaseHas('users', ['id' => $firstId, 'avatar_path' => basename($firstUrl)]);
        $this->assertDatabaseHas('users', ['id' => $secondId, 'avatar_path' => null]);
        Storage::disk('profile-images')->assertExists(basename($firstUrl));
        Storage::disk('profile-images')->assertMissing(basename($secondUrl));
    }

    public function test_profile_photo_media_route_rejects_unknown_files(): void
    {
        $this->assertApiError(
            $this->getJson('/api/v1/media/profile-images/missing.png'),
            404,
            'NOT_FOUND',
        );

        $this->get('/api/v1/media/profile-images/..%2F..%2F.env')->assertStatus(404);
    }

    /**
     * POST one multipart avatar upload with the customer token.
     */
    private function upload(string $token, UploadedFile $file): TestResponse
    {
        return $this->post(
            '/api/v1/auth/profile/avatar',
            ['image' => $file],
            $this->headers($token),
        );
    }

    /**
     * Bearer token plus the JSON accept header.
     *
     * @return array<string, string>
     */
    private function headers(string $token): array
    {
        return [
            'Authorization' => 'Bearer '.$token,
            'Accept' => 'application/json',
        ];
    }

    /** A real PNG upload, decoded from the fixture bytes. */
    private function png(string $name): UploadedFile
    {
        return $this->tempFile($name, base64_decode(self::PNG_BYTES));
    }

    /**
     * A real file on disk wrapped as an UploadedFile with test semantics, so
     * validation reads the same content types a live request would.
     */
    private function tempFile(string $name, string $contents): UploadedFile
    {
        $path = tempnam(sys_get_temp_dir(), 'eshop-avatar');
        file_put_contents($path, $contents);

        return new UploadedFile($path, $name, null, null, true);
    }
}
