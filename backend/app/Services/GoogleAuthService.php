<?php

namespace App\Services;

use App\Exceptions\ApiException;
use App\Support\GoogleIdentity;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * AUTH-004: verifies a Google Sign-In ID token without an SDK dependency.
 *
 * The RS256 signature is checked against Google's published JWKS, then the
 * issuer, audience, expiry, and verified-email claims are enforced. The raw
 * token and its signature are never stored, cached, logged, or returned.
 */
class GoogleAuthService
{
    private const JWKS_URL = 'https://www.googleapis.com/oauth2/v3/certs';

    private const JWKS_CACHE_KEY = 'auth-google:jwks';

    private const JWKS_CACHE_SECONDS = 3600;

    /** @var array<int, string> */
    private const ALLOWED_ISSUERS = ['https://accounts.google.com', 'accounts.google.com'];

    /** Tolerance for client/server clock differences when checking `exp` and `nbf`. */
    private const CLOCK_SKEW_SECONDS = 60;

    /**
     * Verify the ID token and return the identity it asserts.
     *
     * @throws ApiException 401 when the token fails any verification step;
     *                      500 when the endpoint is unconfigured or Google's
     *                      JWKS cannot be retrieved.
     */
    public function verify(string $idToken): GoogleIdentity
    {
        $audiences = $this->configuredAudiences();

        if ($audiences === []) {
            // AUTH-B01: make the misconfiguration visible in server logs instead
            // of leaving only a generic 500 in monitoring.
            Log::error('Google Auth failed: GOOGLE_CLIENT_ID is not configured in .env (set GOOGLE_CLIENT_ID or GOOGLE_CLIENT_IDS).');

            // Fail closed: without an expected audience no token can be trusted.
            $this->serverError();
        }

        $segments = explode('.', $idToken);

        if (count($segments) !== 3) {
            $this->reject();
        }

        [$encodedHeader, $encodedPayload, $encodedSignature] = $segments;

        $header = $this->decodeJson($encodedHeader);
        $claims = $this->decodeJson($encodedPayload);
        $signature = $this->decodeBase64Url($encodedSignature);

        if ($header === null || $claims === null || $signature === false) {
            $this->reject();
        }

        if (($header['alg'] ?? null) !== 'RS256' || ! is_string($header['kid'] ?? null)) {
            $this->reject();
        }

        $this->verifyClaims($claims, $audiences);
        $this->verifySignature($encodedHeader.'.'.$encodedPayload, $signature, $header['kid']);

        [$firstName, $lastName] = $this->extractName($claims);

        return new GoogleIdentity(
            subject: $claims['sub'],
            email: strtolower($claims['email']),
            firstName: $firstName,
            lastName: $lastName,
        );
    }

    /**
     * Every first-party OAuth client ID this deployment trusts.
     *
     * `services.google.client_id` may be a single string or an array, and
     * `services.google.client_ids` may be an array or a comma-separated
     * string, so Android, web, and iOS clients can share one deployment.
     * Blank entries are ignored and duplicates keep their first position.
     *
     * @return array<int, string>
     */
    private function configuredAudiences(): array
    {
        $primary = config('services.google.client_id');
        $additional = config('services.google.client_ids', '');

        $candidates = array_merge(
            is_array($primary) ? $primary : [$primary],
            is_array($additional) ? $additional : explode(',', (string) $additional),
        );

        $audiences = [];

        foreach ($candidates as $candidate) {
            if (! is_string($candidate)) {
                continue;
            }

            $candidate = trim($candidate);

            if ($candidate !== '' && ! in_array($candidate, $audiences, true)) {
                $audiences[] = $candidate;
            }
        }

        return $audiences;
    }

    /**
     * @param  array<string, mixed>  $claims
     * @param  array<int, string>  $audiences
     */
    private function verifyClaims(array $claims, array $audiences): void
    {
        $now = now()->getTimestamp();

        $issuer = $claims['iss'] ?? null;

        if (! is_string($issuer) || ! in_array($issuer, self::ALLOWED_ISSUERS, true)) {
            $this->reject();
        }

        $audience = $claims['aud'] ?? null;
        $claimedAudiences = is_string($audience) ? [$audience] : (is_array($audience) ? $audience : []);

        $audienceMatches = false;

        foreach ($claimedAudiences as $claimed) {
            if (! is_string($claimed)) {
                continue;
            }

            foreach ($audiences as $trusted) {
                if (hash_equals($trusted, $claimed)) {
                    $audienceMatches = true;

                    break 2;
                }
            }
        }

        if (! $audienceMatches) {
            $this->reject();
        }

        $expiresAt = $claims['exp'] ?? null;

        if (! is_int($expiresAt) || $expiresAt < $now - self::CLOCK_SKEW_SECONDS) {
            $this->reject();
        }

        $notBefore = $claims['nbf'] ?? null;

        if ($notBefore !== null && (! is_int($notBefore) || $notBefore > $now + self::CLOCK_SKEW_SECONDS)) {
            $this->reject();
        }

        if (($claims['email_verified'] ?? null) !== true) {
            $this->reject();
        }

        if (! is_string($claims['email'] ?? null) || $claims['email'] === '') {
            $this->reject();
        }

        if (! is_string($claims['sub'] ?? null) || $claims['sub'] === '') {
            $this->reject();
        }
    }

    private function verifySignature(string $signedInput, string $signature, string $keyId): void
    {
        $publicKey = $this->publicKeyFor($this->findJwk($keyId));

        if ($publicKey === false || openssl_verify($signedInput, $signature, $publicKey, OPENSSL_ALGO_SHA256) !== 1) {
            $this->reject();
        }
    }

    /**
     * Build an OpenSSL public key from a JWKS entry.
     *
     * `x5c` is used when present, but Google's current
     * `https://www.googleapis.com/oauth2/v3/certs` response publishes only the
     * RSA `n`/`e` members, so the key must also be reconstructed from them or
     * every real ID token would be rejected.
     *
     * @param  array<string, mixed>  $jwk
     */
    private function publicKeyFor(array $jwk): \OpenSSLAsymmetricKey|false
    {
        $certificate = $jwk['x5c'][0] ?? null;

        if (is_string($certificate) && $certificate !== '') {
            $publicKey = openssl_pkey_get_public(
                "-----BEGIN CERTIFICATE-----\n".chunk_split($certificate, 64, "\n").'-----END CERTIFICATE-----',
            );

            if ($publicKey !== false) {
                return $publicKey;
            }
        }

        $modulus = $jwk['n'] ?? null;
        $exponent = $jwk['e'] ?? null;

        if (! is_string($modulus) || ! is_string($exponent)) {
            return false;
        }

        $modulusBytes = $this->decodeBase64Url($modulus);
        $exponentBytes = $this->decodeBase64Url($exponent);

        if ($modulusBytes === false || $exponentBytes === false || $modulusBytes === '' || $exponentBytes === '') {
            return false;
        }

        $der = $this->rsaPublicKeyDer($modulusBytes, $exponentBytes);

        return openssl_pkey_get_public(
            "-----BEGIN PUBLIC KEY-----\n".chunk_split(base64_encode($der), 64, "\n").'-----END PUBLIC KEY-----',
        );
    }

    /**
     * DER-encode a JWK RSA modulus/exponent as SubjectPublicKeyInfo
     * (RFC 5280) with the `rsaEncryption` algorithm identifier.
     */
    private function rsaPublicKeyDer(string $modulus, string $exponent): string
    {
        $rsaPublicKey = $this->derEncode(0x30, $this->derInteger($modulus).$this->derInteger($exponent));

        $algorithmIdentifier = $this->derEncode(0x30, $this->derEncode(0x06, "\x2a\x86\x48\x86\xf7\x0d\x01\x01\x01")."\x05\x00");

        return $this->derEncode(0x30, $algorithmIdentifier.$this->derEncode(0x03, "\x00".$rsaPublicKey));
    }

    private function derInteger(string $bytes): string
    {
        $bytes = ltrim($bytes, "\x00");

        if ($bytes === '') {
            $bytes = "\x00";
        } elseif ((ord($bytes[0]) & 0x80) !== 0) {
            // DER integers are signed; keep the value positive.
            $bytes = "\x00".$bytes;
        }

        return $this->derEncode(0x02, $bytes);
    }

    private function derEncode(int $tag, string $value): string
    {
        $length = strlen($value);

        if ($length < 0x80) {
            $encodedLength = chr($length);
        } else {
            $lengthBytes = ltrim(pack('N', $length), "\x00");
            $encodedLength = chr(0x80 | strlen($lengthBytes)).$lengthBytes;
        }

        return chr($tag).$encodedLength.$value;
    }

    /**
     * @return array<string, mixed>
     */
    private function findJwk(string $keyId): array
    {
        $jwk = $this->findKey($this->fetchJwks(), $keyId);

        if ($jwk === null) {
            // Google may have rotated its keys; refetch once before rejecting.
            Cache::forget(self::JWKS_CACHE_KEY);
            $jwk = $this->findKey($this->fetchJwks(), $keyId);
        }

        if ($jwk === null) {
            $this->reject();
        }

        return $jwk;
    }

    /**
     * @param  array<int, array<string, mixed>>  $keys
     * @return array<string, mixed>|null
     */
    private function findKey(array $keys, string $keyId): ?array
    {
        foreach ($keys as $key) {
            if (($key['kid'] ?? null) === $keyId) {
                return $key;
            }
        }

        return null;
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function fetchJwks(): array
    {
        return Cache::remember(self::JWKS_CACHE_KEY, self::JWKS_CACHE_SECONDS, function (): array {
            try {
                $response = Http::acceptJson()->timeout(5)->get(self::JWKS_URL);
            } catch (ConnectionException) {
                $this->serverError();
            }

            $keys = $response->successful() ? $response->json('keys') : null;

            if (! is_array($keys)) {
                $this->serverError();
            }

            return array_values(array_filter($keys, is_array(...)));
        });
    }

    /**
     * @param  array<string, mixed>  $claims
     * @return array{string, string}
     */
    private function extractName(array $claims): array
    {
        $given = is_string($claims['given_name'] ?? null) ? trim($claims['given_name']) : '';
        $family = is_string($claims['family_name'] ?? null) ? trim($claims['family_name']) : '';
        $full = is_string($claims['name'] ?? null) ? trim($claims['name']) : '';
        $pieces = $full === '' ? [] : preg_split('/\s+/', $full);

        $given = $given !== '' ? $given : ($pieces[0] ?? Str::before($claims['email'].'@', '@'));
        $family = $family !== '' ? $family : implode(' ', array_slice($pieces, 1));

        return [
            Str::limit($given, 80, ''),
            Str::limit($family === '' ? '-' : $family, 80, ''),
        ];
    }

    /**
     * @return array<string, mixed>|null
     */
    private function decodeJson(string $encoded): ?array
    {
        $decoded = $this->decodeBase64Url($encoded);

        if ($decoded === false) {
            return null;
        }

        $value = json_decode($decoded, true);

        return is_array($value) ? $value : null;
    }

    private function decodeBase64Url(string $encoded): string|false
    {
        $padding = (4 - strlen($encoded) % 4) % 4;

        return base64_decode(strtr($encoded, '-_', '+/').str_repeat('=', $padding), true);
    }

    private function reject(): never
    {
        throw new ApiException(
            401,
            'INVALID_CREDENTIALS',
            'The Google sign-in credential is invalid or expired.',
        );
    }

    private function serverError(): never
    {
        throw new ApiException(500, 'INTERNAL_ERROR', 'An unexpected error occurred.');
    }
}
