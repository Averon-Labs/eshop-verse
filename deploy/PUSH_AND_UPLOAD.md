# Push and upload — how to ship this work

Branch: `feature/android-phase-12` → pull request into `develop` (GitHub Flow per `AGENTS.md`).

## 1. Commits on the branch

```
fix(android-p12-s03-auth-013): report Google sign-in failures without a password error
fix(backend): serve the admin SPA at / instead of Laravel's welcome page
chore(deploy): add the host release packer and upload instructions
```

Push from the machine holding the clone:

```bash
git switch feature/android-phase-12
git pull --ff-only origin feature/android-phase-12   # only if the branch moved remotely
git push origin feature/android-phase-12
```

## 2. Open the pull request

Compare link (base `develop`):

```
https://github.com/Averon-Labs/eshop-verse/compare/develop...feature/android-phase-12?expand=1
```

Title:

```
fix(android-p12-s03-auth-013): report Google sign-in failures without a password error
```

Body — the repository template, filled in:

```markdown
## Description
Google sign-in/sign-up in the Android app reported a password error instead of the real
outcome. The Account tab's guest card called loginWithGoogle but its error handler had no
Google branch, so a rejection was painted on the password field and its Retry re-submitted
the email/password form. This also adds the host release packer and stops Laravel's welcome
page from ever being served at "/".

## Roadmap Task
- Task ID: AUTH-013 (Android Roadmap — Phase 12 — Step 3); deployment packaging is not a roadmap task

## Type of Change
- [x] Fix — bug fix
- [x] Chore — tooling, config, maintenance
- [x] Test — test additions or modifications

## Changes Made
- AccountFragment: Google failures show a snackbar, never touch the credential fields or
  their submit path, and the Google button toggles with the loading state.
- GoogleAuthTest: key generation passes a minimal OpenSSL config so the suite runs on PHP
  builds without openssl.cnf.
- routes/web.php: "/" serves the built admin SPA (htdocs/index.html, then public/index.html),
  never view('welcome').
- deploy/build-release.sh: builds the SPA and packs output/eshopverse-admin.zip,
  output/eshopverse_app.zip, and the complete output/htdocs host root.
- deploy/upload-README.md, deploy/PUSH_AND_UPLOAD.md, docs/RELEASE_NOTES_2026-11-03.md.

## Testing
- `DB_CONNECTION=sqlite DB_DATABASE=":memory:" php artisan test tests/Feature/Auth` → 60 passed, 479 assertions
- `... GoogleAuthTest.php` → 20 passed, 135 assertions
- `... php artisan test` → 200 passed, 2 failed (engine-only: mysql driver assertion, MySQL collation case)
- `vendor/bin/pint --test routes/web.php tests/Feature/Auth/GoogleAuthTest.php` → PASS
- `npm ci && npm run build` in admin/ → success
- Packaged app: migrate + seed succeeded; host-layout smoke test — `/` 200 SPA (no Laravel text),
  `/login` 200 SPA, `/up` 200 `{"status":"up"}`, `/api/v1/products` 200, `/api/v1/categories` 200
- Not run: Android `testDebugUnitTest` (no JDK/Android SDK on this machine)
```

`develop` is the only merge target; never merge automatically.

## 3. Upload to the host

Artefacts are produced by `bash deploy/build-release.sh` into `output/` (git-ignored).

1. Back up the host's `htdocs/index.html`, `htdocs/assets/`, `htdocs/fonts/`, and `htdocs/eshopverse_app/.env`.
2. Upload and extract `output/eshopverse_app.zip` into `htdocs/` — it creates `htdocs/eshopverse_app/`
   and does not contain `.env`, so the host configuration survives.
3. Upload and extract `output/eshopverse-admin.zip` into `htdocs/`, then delete the old hashed files in
   `htdocs/assets/` after confirming the new `index.html` references them.
4. Upload `htdocs/index.php` and `htdocs/.htaccess` into `htdocs/` — `.htaccess` is hidden in the file
   manager, enable "Show hidden files" first.
5. Keep `eshopverse_app/storage/` and `eshopverse_app/bootstrap/cache/` writable; keep the host's
   `storage/app/product-images/` contents.
6. Hard-refresh (`Ctrl+F5`) and verify below.

`output/htdocs/` mirrors the host root exactly, so uploading that single folder is equivalent to steps 2–4.

## 4. Post-upload checks

| Request | Expected |
|---------|----------|
| `GET /` | admin sign-in SPA — never a Laravel page |
| `GET /login` | SPA sign-in route (needs the root `.htaccess`) |
| `GET /up` with `Accept: application/json` | `{"status":"up"}` |
| `GET /api/v1/products` | JSON product list |
| Sign in with the seeded administrator | session cookie set, dashboard loads |

Host `.env` values that must already exist: `APP_ENV=production`, `APP_DEBUG=false`, `APP_URL`, the
`DB_*` values, `SESSION_SECURE_COOKIE=true`, `SANCTUM_STATEFUL_DOMAINS`, `CORS_ALLOWED_ORIGINS`,
`GOOGLE_CLIENT_ID`, and `APP_KEY`.

## 5. Rollback

Restore the previous `index.html`, `assets/`, and `fonts/`, keep `index.php`/`.htaccess`/`eshopverse_app/`,
and hard-refresh. No database change is part of this release.
