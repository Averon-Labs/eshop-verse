# Pull request — Google Sign-In diagnostics + deploy-ready host bundle

Branch `feature/android-phase-12` → base `develop`
Compare: `https://github.com/Averon-Labs/eshop-verse/compare/develop...feature/android-phase-12?expand=1`

Title:

```
fix(android-p12-s03-auth-013): report actionable Google sign-in failures
```

Paste everything between the markers below into the PR body.

<!-- PR BODY START -->
## Description

Google sign-in/sign-up in the Android app never completed for the owner, and every attempt failed with a message
that could not identify the cause. This PR makes the failure cause explicit and verifies the deployable
backend + admin bundle.

**What the investigation established (evidence, not assumption):**

| Check | Result |
|---|---|
| `POST https://eshopverse.wasmer.app/api/v1/auth/google` with a 3-character token | `422 VALIDATION_ERROR` — route live, validation working |
| Same endpoint with a well-formed JWT carrying the app's Web client as `aud` | `401 INVALID_CREDENTIALS` — **not** `500`, so `GOOGLE_CLIENT_ID` **is** configured on the host and token verification runs |
| App's client ID probed at `https://oauth2.googleapis.com/token` | `client_secret is missing` → a real **Web application** OAuth client; a control ID returned `The OAuth client was not found` |
| Client code path | Credential Manager → `GetGoogleIdOption(serverClientId = Web client)` → `idToken` → `POST /auth/google` → session persisted; token expiry parser handles the server's `+00:00` timestamps; auth endpoints are never answered by `OfflineMockInterceptor` |
| Built APK config | `API_BASE_URL=https://eshopverse.wasmer.app/api/v1`, `GOOGLE_WEB_CLIENT_ID=702430048689-…apps.googleusercontent.com` |
| Backend Google suite | 20 tests / 135 assertions pass |

Conclusion: the server accepts Google ID tokens and the app requests them correctly, so Google is never *issuing*
the token — the APK's package name + signing SHA-1 is not registered as an **Android** OAuth client in the same
Google Cloud project. The app previously hid this: every Credential Manager failure was flattened into one vague
string, so "not registered with Google", "no Google Play services" and "server rejected the credential" were
indistinguishable.

## What changed

### Android app — actionable failure reporting

- `GoogleAuthManager`
  - New `GoogleAuthFailure` enum: `CANCELLED`, `NO_CREDENTIAL`, `PLAY_SERVICES_UNAVAILABLE`, `NOT_CONFIGURED`,
    `UNSUPPORTED`, `INTERRUPTED`, `UNEXPECTED_CREDENTIAL`, `EMPTY_TOKEN`, `PARSE_FAILED`, `UNKNOWN`.
  - `GoogleAuthCallback.onError` now reports the typed failure instead of a raw English string; every exception
    path (null response, wrong credential type, empty token, parse failure, provider errors) maps to a type.
  - `classify(...)` uses the **public** exception subclasses (`GetCredentialCancellationException`,
    `NoCredentialException`, `GetCredentialProviderConfigurationException`,
    `GetCredentialUnsupportedException`, `GetCredentialInterruptedException`) plus Google's
    `[28444] Developer console is not set up correctly` message. It deliberately does not call
    `GetCredentialException.getType()`, which is `@RestrictTo` and fails `lintDebug` (caught by lint and fixed
    in the second commit).
  - `messageResFor(...)` maps each failure to a string resource, so no user-visible text lives in code.
- `SignInFragment`, `RegisterFragment`, `AccountFragment` — Google errors render the mapped string resource
  through the existing Snackbar paths instead of interpolating exception text. Email/password fields and their
  submit path are still never touched by a Google attempt.
- `res/values/strings_auth.xml` — new actionable messages, for example
  `auth_error_google_not_configured` ("Google sign-in is not set up for this build. Register this app's package
  name and SHA-1 signing fingerprint on the Google Cloud OAuth client, then install a new build."),
  `auth_error_google_play_services`, `auth_error_google_unsupported`, `auth_error_google_interrupted`,
  `auth_error_google_unexpected_credential`; `auth_error_google_no_credential` reworded to be account-focused.
- `GoogleAuthManagerTest` — rewritten for the typed contract, with cases pinning the classification of
  configuration issues, Play services, cancellation, unsupported/interrupted providers, and every message
  resource resolving to a non-zero id.

### Backend — no code change required for Google auth

`POST /api/v1/auth/google` already verifies the ID token (RS256 against Google's JWKS, issuer, audience, expiry,
verified email), creates a password-less customer on first use, links an existing password account, rejects
identity conflicts with `409`, reports suspended accounts as `403 ACCOUNT_DISABLED`, and issues the same Sanctum
bearer session as password sign-in. The suite that proves this passes unchanged.

The only backend-side requirement is configuration on the host: `GOOGLE_CLIENT_ID` must equal the app's **Web**
client ID. The live endpoint answering `401` rather than `500` shows it is set; the value itself cannot be read
from this machine.

### Backend + admin panel packaged for host upload (no Laravel welcome page)

`bash deploy/build-release.sh` was run against this tree and produced, in the git-ignored `output/`:

| Artefact | Size | Contents |
|----------|------|----------|
| `output/eshopverse_app.zip` | 18 MB | `eshopverse_app/` including `vendor/`; no `.env`, `tests/`, `phpunit.xml`, logs, cached views, or `welcome.blade.php` |
| `output/eshopverse-admin.zip` | 1.1 MB | `index.html`, `assets/` (`index-CVB9Jh28.js`, `index-BHrMMJys.css`), `fonts/` |
| `output/htdocs/` | — | complete host root: `index.php`, `.htaccess`, SPA files, `eshopverse_app/` |
| `output/README.md` | — | copy of `deploy/upload-README.md` (upload order + post-upload checks) |

Laravel's welcome page cannot be served: `backend/routes/web.php` serves the built admin shell (or a neutral
"EShop Verse API is running" page if no bundle is uploaded) and the packer deletes
`resources/views/welcome.blade.php` from the archive.

## Roadmap task

- Task ID: **AUTH-013** — Android Roadmap, Phase 12, Step 3 (Google sign-in error handling).
- The release packaging and the Google Cloud prerequisite record answer the owner's request to make the
  backend + admin bundle deploy-ready; they are not a separate roadmap task.

## Type of change

- [x] Fix — bug fix
- [x] Chore — tooling, config, maintenance
- [x] Test — test additions or modifications
- [x] Docs — documentation update

## Commits

| # | Subject |
|---|---------|
| 1 | `fix(android-p12-s03-auth-013): report actionable Google sign-in failures` |
| 2 | `fix(android-p12-s03-auth-013): classify Google failures via public exceptions` |
| 3 | `docs(deploy): refresh the pull-request description with the Google sign-in fix and bundle verification` |

SHAs are not pinned here: this PR's **Commits** tab is authoritative.

## Files changed

- `android/app/src/main/java/com/averonlabs/eshopverse/auth/GoogleAuthManager.java`
- `android/app/src/main/java/com/averonlabs/eshopverse/auth/SignInFragment.java`
- `android/app/src/main/java/com/averonlabs/eshopverse/auth/RegisterFragment.java`
- `android/app/src/main/java/com/averonlabs/eshopverse/auth/AccountFragment.java`
- `android/app/src/main/res/values/strings_auth.xml`
- `android/app/src/test/java/com/averonlabs/eshopverse/auth/GoogleAuthManagerTest.java`
- `deploy/PULL_REQUEST.md` (this description)

## Verification actually executed

Toolchain used on this machine: Temurin JDK 21 (temporary install), Android SDK with platform 36.1 auto-installed
by Gradle, Node 26 / npm 11, PHP 8.4.

### Android

| Check | Result |
|-------|--------|
| `./gradlew testDebugUnitTest` | **BUILD SUCCESSFUL — 253 tests, 0 failed, 0 skipped** (17 in `GoogleAuthManagerTest`) |
| `./gradlew lintDebug` | **BUILD SUCCESSFUL — 0 errors**, 0 issues in changed files (182 pre-existing warnings elsewhere) |
| `./gradlew assembleDebug` | **BUILD SUCCESSFUL**, `app-debug.apk` (15 MB) |

### Backend

| Check | Result |
|-------|--------|
| `php artisan test tests/Feature/Auth/GoogleAuthTest.php` (SQLite) | **20 passed, 135 assertions** |
| Live host `POST /api/v1/auth/google` | `422` for a short token; `401 INVALID_CREDENTIALS` for a forged token (configured, not `500`) |
| Live host `GET /api/v1/products` | `200` |

### Packaged bundle (host layout, `php -S` with a router mirroring the root `.htaccess`)

| Request | Result |
|---------|--------|
| `GET /` | `200`, `<title>EShop Verse Admin</title>`, **0 matches for "laravel"** |
| `GET /login` | `200` (admin SPA) |
| `GET /up` with `Accept: application/json` | `{"status":"up"}` `200` |
| `GET /api/v1/products` | `200` with product data |
| `GET /api/v1/categories` | `200` with categories |
| `POST /api/v1/auth/google` short token | `422 VALIDATION_ERROR` |
| `POST /api/v1/auth/google` with no client ID configured | `500 INTERNAL_ERROR` (fails closed, creates no account) |
| Archive hygiene | no `.env`, `welcome.blade.php`, `phpunit.xml`, `tests/`, or `*.log`; `vendor/autoload.php` and `.htaccess` present |
| Temporary smoke-test `.env`, router, and SQLite file | created inside the git-ignored `output/` only, then deleted |

## Android APK

Built and ready: `android/app/build/outputs/apk/debug/app-debug.apk` (15 MB, debug-signed).

```
package: com.averonlabs.eshopverse
SHA-1:   0F:F9:A0:C3:87:03:B1:07:C2:6D:76:F2:10:FA:7E:74:2D:BD:C2:D8
SHA-256: 80:15:2D:8B:FE:77:1B:66:44:F8:47:CE:54:CD:9B:A6:FC:34:59:39:8E:AB:E0:AF:22:3C:02:05:32:98:F2:0B
```

## One-time manual step still required for Google sign-in to complete

1. In the Google Cloud project that owns `702430048689-…apps.googleusercontent.com`, create an OAuth client of
   type **Android** with package `com.averonlabs.eshopverse` and the SHA-1 above (add the release/Play App Signing
   SHA-1 too if the release build is used).
2. Keep `GOOGLE_CLIENT_ID` on the host equal to the **Web** client ID above — it is the ID token audience, not
   the Android client.
3. Rebuild/reinstall the app and retry. If anything is still missing, the app now names it (not registered with
   Google, Play services missing, or server rejection).

## Deploying this bundle

1. `bash deploy/build-release.sh` (already run; writes `output/`).
2. Back up the host's `htdocs/index.html`, `htdocs/assets/`, `htdocs/fonts/`, `htdocs/eshopverse_app/.env`.
3. Extract `output/eshopverse_app.zip` into `htdocs/` (keeps the host `.env`; the archive has none).
4. Extract `output/eshopverse-admin.zip` into `htdocs/` and delete old hashed files in `htdocs/assets/`.
5. Upload `htdocs/index.php` and `htdocs/.htaccess` (enable "Show hidden files").
6. Keep `eshopverse_app/storage/` and `eshopverse_app/bootstrap/cache/` writable and keep
   `storage/app/product-images/`.
7. Hard-refresh and verify `/`, `/login`, `/up`, `/api/v1/products`.

Rollback: restore the previous `index.html`, `assets/`, `fonts/`; keep `index.php`, `.htaccess`, and
`eshopverse_app/`. This release contains no database migration.

## Known limitations

- No device or emulator was attached (`adb devices` is empty), so a real Google-account sign-in could not be
  completed end-to-end. Everything up to and including the token request is covered by the unit suite, the built
  APK, and the live endpoint probes.
- The host's `.env` cannot be read from this machine; the `401`-vs-`500` response proves `GOOGLE_CLIENT_ID` is
  set, not which value it holds.
- 182 lint warnings exist elsewhere in the project and are pre-existing; none are in the changed files.
- `output/` artefacts are intentionally not committed (git-ignored).
<!-- PR BODY END -->
