# ADR-003: Secure Token Storage Mechanism

## Status

ACCEPTED

## Date

2026-10-10

## Context

The Android customer application requires persistent authentication token storage to maintain signed-in customer sessions across app restarts. The token is a sensitive bearer credential that must satisfy strict security guarantees:

1. Platform-protected storage only; never stored in plaintext preferences, external storage, build properties, or source control.
2. Hardware-backed key material that cannot be exported from the device.
3. No token value, prefix, or length may appear in application logs, crash reports, or default `toString()` outputs.
4. Token store must be explicitly excluded from cloud backups and device-to-device transfers to prevent restoring encrypted blobs whose hardware keys do not exist on the target device.

## Options Considered

### Option A: `androidx.security:security-crypto` (`EncryptedSharedPreferences`)

- **Pros:**
  - High-level Google library providing drop-in `SharedPreferences` replacement.
- **Cons:**
  - `androidx.security:security-crypto` is effectively unmaintained and deprecated.
  - Known for fatal `KeyStoreException` and `AEADBadTagException` crashes, particularly on custom OEM Android distributions (Samsung, Xiaomi) during key migration or app updates.
  - Pulls in heavy Google Tink dependencies that introduce version conflicts and increase APK footprint.

### Option B: Native Android KeyStore with AES-256-GCM

- **Pros:**
  - Standard Android platform security architecture (`AndroidKeyStore` provider).
  - Cryptographically robust: AES-256 in GCM mode with 128-bit authentication tag and randomized 12-byte IV per encryption operation.
  - Hardware-backed on modern devices (TEE / StrongBox) with non-exportable keys.
  - Zero external dependencies; consistent, predictable lifecycle across API 25 through API 36.
  - Total control over error handling (safely wiping corrupted credentials rather than crashing).
- **Cons:**
  - Requires explicit implementation of cipher initialization, key generation, and preference storage.

## Decision

Choose **Option B: Native Android KeyStore with AES-256-GCM** (`KeystoreTokenStore`).

The implementation stores ciphertext, IV, and expiry timestamp in private app preferences (`eshopverse_secure_tokens.xml`). The preference file is excluded from Android cloud backup and device-to-device transfer via `res/xml/data_extraction_rules.xml`, `res/xml/backup_rules.xml`, and `android:allowBackup="false"` in `AndroidManifest.xml`.

For JVM unit tests and test harnesses, an `InMemoryTokenStore` implements the identical `TokenStore` interface without Android KeyStore dependencies.

## Consequences

- Secure token storage is isolated in `com.averonlabs.eshopverse.core.storage`.
- The app has zero dependency on `androidx.security:security-crypto`.
- Token redaction is enforced at the model and storage levels (`AuthToken`, `AuthSession`, `TokenStore`).
