# Pull request — Google Sign-In fix + host release packages

Branch `feature/android-phase-12` → base `develop`
Compare: `https://github.com/Averon-Labs/eshop-verse/compare/develop...feature/android-phase-12?expand=1`

Title:

```
fix(android-p12-s03-auth-013): report Google sign-in failures without a password error
```

Paste everything between the markers below into the PR body.

<!-- PR BODY START -->
## Description

Google sign-in/sign-up in the Android app never completed and surfaced an error that read like a wrong
password. The Account tab's guest card — the app's main sign-in surface — called
`AuthViewModel.loginWithGoogle()` but its error handler had no Google branch, unlike `SignInFragment` and
`RegisterFragment` (fixed earlier as AUTH-013). A rejected Google attempt therefore cleared the password box,
painted the message on the password field, and offered a Retry that re-submitted the **email/password** form
with an empty password.

This PR fixes that reporting path, makes the backend Google suite runnable on machines without a system
`openssl.cnf`, and adds the release tooling that packages the admin SPA together with the Laravel application
for host upload — including a guarantee that Laravel's stock welcome ("start up") page can never be served.

## Roadmap Task

- Task ID: AUTH-013 (Android Roadmap — Phase 12 — Step 3)
- The deployment packaging part is not a roadmap task; it answers the owner's request to build and pack the
  admin panel and backend for upload.

## Type of Change

- [x] Fix — bug fix
- [x] Chore — tooling, config, maintenance
- [x] Test — test additions or modifications
- [x] Docs — documentation update

## Commits

| # | Subject |
|---|---------|
| 1 | fix(android-p12-s03-auth-013): report Google sign-in failures without a password error |
| 2 | fix(backend): serve the admin SPA at / instead of Laravel's welcome page |
| 3 | chore(deploy): add the host release packer and upload instructions |
| 4 | docs(deploy): add the full pull-request description |
| 5 | docs(deploy): fix a typo in the pull-request description |
| 6 | docs(deploy): list every commit of the branch in the pull-request description |

SHAs are not repeated here: rebasing rewrites them, so this pull request's **Commits** tab is authoritative.

## Files changed

### Google Sign-In

- `android/app/src/main/java/com/averonlabs/eshopverse/auth/AccountFragment.java`
  - A Google failure restores the content state and reports through `showAnchoredSnackbar(...)` — never
    through `tilGuestPassword.setError(...)`.
  - The email/password fields and the credential submit path are never touched by a Google attempt, and the
    retry no longer re-runs `login(email, password)`.
  - `btnGuestGoogleSignIn` is disabled while a sign-in is in flight and re-enabled on content or error, so the
    button state matches the progress indicator.

- `backend/tests/Feature/Auth/GoogleAuthTest.php`
  - `keyPair()` and the rogue-key case now pass an explicit minimal OpenSSL config
    (`openssl_pkey_new`, `openssl_csr_new`, `openssl_csr_sign`). Without it, bare PHP builds that ship no
    `openssl.cnf` made `openssl_csr_new()` return `false`, so 17 of 20 tests errored before reaching
    `POST /auth/google`. No assertion, fixture, or faked-JWKS behaviour was changed.

No production backend code needed changing for Google auth: `POST /api/v1/auth/google` already verifies the
ID token (RS256 against Google's JWKS, issuer, audience, expiry, verified email), creates a password-less
customer on first use, links an existing password account, and issues the same Sanctum bearer session
as password sign-in.

### Never show Laravel's welcome page

- `backend/routes/web.php` — the root route no longer renders `view('welcome')`. It serves the built admin
  shell (`htdocs/index.html` next to the app directory, then `public/index.html`) and otherwise returns a
  neutral "EShop Verse API is running" page with links to `/up` and `/api/v1/products`. This covers the case
  where the hidden root `.htaccess` was not uploaded and Apache falls through to the front controller.

- `deploy/build-release.sh` — excludes `resources/views/welcome.blade.php` from the application archive, so the
  stock page is not present on the host at all.

### Release packaging

- `deploy/build-release.sh` (new) — one command, `bash deploy/build-release.sh`:
  1. `npm ci` + `npm run build` in `admin/` (`tsc --noEmit && vite build`; `admin/.env.production` keeps
     `VITE_API_BASE_URL=/api/v1` for the same-origin deployment);
  2. stages a complete host root and the Laravel application;
  3. packs `output/eshopverse-admin.zip`, `output/eshopverse_app.zip`, and copies `deploy/upload-README.md`
     to `output/README.md`.
  It works with `zip`, Windows `bsdtar`, or PowerShell `Compress-Archive`, so it runs on the owner's machine.

- `deploy/upload-README.md` (new) — package table, upload order, post-upload checks.

- `deploy/PUSH_AND_UPLOAD.md` (new) — push commands, compare link, PR title/body, host upload order,
  verification table, rollback.

- `deploy/PULL_REQUEST.md` (this file) — the complete pull-request description.

- `docs/RELEASE_NOTES_2026-11-03.md` (new) — root cause, fixes, verification log, known limitations.

### Generated upload artefacts (git-ignored, produced locally by the packer)

| Artefact | Size | Contents |
|----------|------|----------|
| `output/eshopverse_app.zip` | 18 MB | `eshopverse_app/` with `vendor/`; no `.env`, `tests/`, `phpunit.xml`, `*.log`, `bootstrap/cache` content, or welcome view |
| `output/eshopverse-admin.zip` | 1.1 MB | `index.html`, `assets/` (`index-CVB9Jh28.js`, `index-BHrMMJys.css`), `fonts/` (Lato + licence) |
| `output/htdocs/` | 65 MB | complete host root: `index.php`, `.htaccess`, SPA files, `eshopverse_app/` |

## Testing

Backend (SQLite fallback, because this machine has no MySQL):

- `php artisan test tests/Feature/Auth` → **60 passed, 479 assertions**
- `php artisan test tests/Feature/Auth/GoogleAuthTest.php` → **20 passed, 135 assertions** (account creation
  201, linked sign-in 200, password-account linking, conflict 409, suspended 403, malformed/expired/
  wrong-audience/wrong-issuer/unverified-email/forged-signature 401, unconfigured client ID 500 + explicit log,
  JWKS outage 500, rate limit with `Retry-After`, multi-audience)
- `php artisan test` → **200 passed, 2 failed**; both failures are engine-only and pre-existing off MySQL:
  `DatabaseWorkflowTest` asserts the `mysql` driver, `AdminCategoryTest`'s duplicate-name case needs MySQL
  column collation. CI runs them on MySQL 8.4.
- `vendor/bin/pint --test routes/web.php tests/Feature/Auth/GoogleAuthTest.php` → **PASS**

Admin panel:

- `npm ci` → 210 packages
- `npm run build` (`tsc --noEmit && vite build`) → success, `dist/index.html` + `assets/index-CVB9Jh28.js`
  (360.93 kB) + `assets/index-BHrMMJys.css` (39.12 kB)

Packaged application and host layout:

- `php artisan migrate --force` and `php artisan db:seed --force` against the staged
  `output/htdocs/eshopverse_app` → both succeeded
- Host-layout smoke test (PHP server + a router mirroring the root `.htaccess`):
  - `GET /` → 200, admin SPA title, **0 matches for "laravel"**
  - `GET /login` → 200 admin SPA (React Router fallback)
  - `GET /up` with `Accept: application/json` → `{"status":"up"}`
  - `GET /api/v1/products` → 200 with 10 products
  - `GET /api/v1/categories` → 200 with 4 categories
- Root without `.htaccess` (front controller handles `/`) → 200 admin SPA, no Laravel text
- Archive hygiene: `.env` absent; `.env.example`, `.htaccess`, `vendor/autoload.php`,
  `storage/app/product-images/` present; no `tests/`, `phpunit.xml`, `*.log`, or `welcome.blade.php`

Not run (stated as a limitation, not a pass):

- Android `testDebugUnitTest` — this machine has no JDK and no Android SDK, so the `AccountFragment` change is
  reviewed but not executed here.
- The deployed host's `GOOGLE_CLIENT_ID` cannot be read from this machine. It must equal the app's Web client
  ID (`702430048689-...apps.googleusercontent.com`, which `backend/.env` already uses locally), and the Google
  Cloud project must also hold the Android client for `com.averonlabs.eshopverse` with the debug and release
  SHA-1 fingerprints, otherwise Google never issues an ID token.

## Deploying this change

1. `bash deploy/build-release.sh` (writes `output/`).
2. Back up the host's `htdocs/index.html`, `htdocs/assets/`, `htdocs/fonts/`, and `htdocs/eshopverse_app/.env`.
3. Extract `output/eshopverse_app.zip` into `htdocs/` (keeps the host `.env`; the archive does not contain it).
4. Extract `output/eshopverse-admin.zip` into `htdocs/` and delete the old hashed files in `htdocs/assets/`.
5. Upload `htdocs/index.php` and `htdocs/.htaccess` (enable "Show hidden files").
6. Keep `eshopverse_app/storage/` and `eshopverse_app/bootstrap/cache/` writable and keep
   `storage/app/product-images/`.
7. Hard-refresh and verify `/`, `/login`, `/up`, `/api/v1/products`.

Rollback: restore the previous `index.html`, `assets/`, `fonts/`; keep `index.php`, `.htaccess`, and
`eshopverse_app/`. No database change is part of this release.
<!-- PR BODY END -->
