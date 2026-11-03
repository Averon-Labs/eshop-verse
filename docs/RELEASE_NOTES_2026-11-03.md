# Release notes — 2026-11-03

Two deliveries on `feature/android-phase-12`: the Google Sign-In failure fix and the host release packages.

## 1. Google Sign-In / Sign-Up

**Reported symptom:** every Google attempt in the Android app ended with an error that read like a wrong
password, and neither sign-in nor sign-up with Google completed.

**Root cause:** `AccountFragment` (the Account tab's guest card — the app's main sign-in surface) called
`AuthViewModel.loginWithGoogle()` but its `handleLoginState` error branch had no Google case. Unlike
`SignInFragment` and `RegisterFragment`, which were fixed for AUTH-013, it therefore:

1. cleared the password box and rendered the message through `tilGuestPassword.setError(...)`, so a Google
   rejection appeared as a password problem; and
2. offered a Retry that re-submitted the email/password form (`authViewModel.login(email, password)`) with an
   empty password, which reads as "the password is wrong".

**Fix (`android/app/src/main/java/com/averonlabs/eshopverse/auth/AccountFragment.java`):**

- a Google failure now restores the content state and reports through `showAnchoredSnackbar(...)`;
- the email/password fields and their submit path are never touched by a Google attempt;
- `btnGuestGoogleSignIn` is disabled while a sign-in is in flight and re-enabled on content or error.

**Backend test portability (`backend/tests/Feature/Auth/GoogleAuthTest.php`):** the suite could not run on a
PHP build without a system `openssl.cnf` (`openssl_csr_new()` returns `false`), which errored 17 of 20 tests
before they touched the endpoint. The key helper now writes a minimal OpenSSL config and passes it to
`openssl_pkey_new()`, `openssl_csr_new()`, and `openssl_csr_sign()`. No assertion was changed.

**Server-side status:** `POST /api/v1/auth/google` itself needed no code change. `tests/Feature/Auth` passes,
covering account creation (201), existing linked sign-in (200), password-account linking, identity conflict
(409), suspended account (403), malformed/expired/wrong-audience/wrong-issuer/unverified-email/forged-signature
(401), unconfigured client ID (500 + explicit log), Google key outage (500), rate limiting, and multi-audience.
`GOOGLE_CLIENT_ID` in `backend/.env` is the same Web client ID the app sends
(`702430048689-...apps.googleusercontent.com`).

## 2. Host release packages

`deploy/build-release.sh` builds the admin SPA and produces, in `output/` (git-ignored):

| Artefact | Contents |
|----------|----------|
| `eshopverse-admin.zip` | `index.html`, `assets/`, `fonts/` at the archive root |
| `eshopverse_app.zip` | folder `eshopverse_app/` including `vendor/`, without `.env`, `tests/`, logs, `bootstrap/cache` |
| `htdocs/` | the complete host root: front controller, `.htaccess`, SPA files, application |
| `README.md` | copy of `deploy/upload-README.md` |

**No Laravel welcome page:** `backend/routes/web.php` no longer renders `view('welcome')`. `/` serves the built
admin shell (`htdocs/index.html`, then `public/index.html`) and otherwise returns a neutral "API is running"
page. The packer also drops `resources/views/welcome.blade.php`, so the stock page cannot be served even if a
root `.htaccess` is missing.

## Verification performed

| Check | Result |
|-------|--------|
| `php artisan test tests/Feature/Auth` (SQLite fallback) | 60 passed, 479 assertions |
| `php artisan test tests/Feature/Auth/GoogleAuthTest.php` | 20 passed, 135 assertions |
| `php artisan test` (SQLite fallback) | 200 passed, 2 failed — `DatabaseWorkflowTest` asserts the `mysql` driver, `AdminCategoryTest` duplicate-name needs MySQL collation (both pre-existing, engine-only) |
| `vendor/bin/pint --test routes/web.php tests/Feature/Auth/GoogleAuthTest.php` | PASS |
| Admin build (`npm ci`, `tsc --noEmit`, `vite build`) | `assets/index-CVB9Jh28.js`, `assets/index-BHrMMJys.css` |
| Packaged app boot (`output/htdocs/eshopverse_app`) | `php artisan migrate --force` and `db:seed --force` succeeded |
| Host-layout smoke test | `GET /` 200 admin SPA (0 "laravel" matches), `GET /login` 200 SPA, `GET /up` `{"status":"up"}`, `GET /api/v1/products` 200 (10 products), `GET /api/v1/categories` 200 (4 categories) |
| Root without `.htaccess` | `GET /` 200 admin SPA, no Laravel text |
| Archive hygiene | `.env` absent; `.env.example`, `.htaccess`, `vendor/autoload.php`, `storage/app/product-images/` present; no tests, `phpunit.xml`, `*.log`, or welcome view |

## Known limitations

- Android `testDebugUnitTest` was not run: this machine has no JDK and no Android SDK. The `AccountFragment`
  change is reviewed but not executed here.
- The two full-suite failures above only exist off MySQL; GitHub Actions runs them against MySQL 8.4.
- The deployed host's `GOOGLE_CLIENT_ID` cannot be read from here. It must equal the app's Web client ID; the
  Google Cloud project must also hold the Android client for package `com.averonlabs.eshopverse` (debug and
  release SHA-1), otherwise Google never issues an ID token.
- `docs/DEPLOYMENT.md` still records the previous bundle names (`index-DwFFOLMM.js`); this build ships
  `index-CVB9Jh28.js`.
