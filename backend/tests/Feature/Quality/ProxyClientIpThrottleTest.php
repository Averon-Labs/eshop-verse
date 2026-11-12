<?php

namespace Tests\Feature\Quality;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * The deployed demo sits behind Wasmer's reverse proxy (127.0.0.100). Every
 * per-IP rate limiter must key on the forwarded client address, otherwise all
 * visitors share one bucket and, for example, the whole site is limited to
 * five registrations per hour.
 */
class ProxyClientIpThrottleTest extends TestCase
{
    use RefreshDatabase;

    private function login(string $forwardedFor, string $email)
    {
        return $this->withServerVariables(['REMOTE_ADDR' => '127.0.0.100'])
            ->withHeaders(['X-Forwarded-For' => $forwardedFor])
            ->postJson('/api/v1/auth/login', [
                'email' => $email,
                'password' => 'WrongPass12345',
            ]);
    }

    public function test_each_forwarded_client_has_its_own_login_throttle_bucket(): void
    {
        for ($i = 1; $i <= 10; $i++) {
            $this->login('203.0.113.10', "proxied{$i}@example.com")->assertStatus(401);
        }

        // The eleventh attempt from the same client is throttled.
        $this->login('203.0.113.10', 'proxied-last@example.com')->assertStatus(429);

        // A different client behind the same proxy is unaffected.
        $this->login('203.0.113.20', 'other-client@example.com')->assertStatus(401);
    }
}
