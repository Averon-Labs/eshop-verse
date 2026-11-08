# Deployment — EShop Verse Public Demo

This document records the optional public deployment of the portfolio demo. It complements
[`DEVELOPMENT.md`](DEVELOPMENT.md), which owns local setup, and [`HANDOFF.md`](HANDOFF.md), which owns the
reviewer walkthrough. No credential, database password, or application key belongs in this file or in the
repository.

> **Live host (2026-11-08).** The public demo is served from **Wasmer Edge** at
> `https://eshopverse.wasmer.app` (Laravel API and admin SPA on one origin, PHP runtime
> `x-phpix-version: 0.3.1`). The ByetHost steps below are kept as a historical reference for that
> earlier host; where the two differ, use the `eshopverse.wasmer.app` values in
> [Required production settings](#required-production-settings).

## Current status (2026-10-19)

| Item | Status |
|------|--------|
| Host | ByetHost free hosting — `https://eshopverse.byethost8.com` (superseded; live host is `https://eshopverse.wasmer.app`) |
| PHP | 8.3 selected in VistaPanel (Laravel 13 requires PHP 8.3+) |
| Database | MySQL database created in VistaPanel; schema and fictional demo data imported through phpMyAdmin |
| Backend | Laravel app deployed under `htdocs/eshopverse_app`; `https://eshopverse.byethost8.com/up` returns HTTP 200 (`{"status":"up"}` with `Accept: application/json`) |
| API | `GET https://eshopverse.byethost8.com/api/v1/products` returns the seeded active products |
| Admin | React SPA served from the same domain; `POST /api/v1/admin/auth/login` returns `200` with the demo administrator |
| Admin sign-in | SPA at `/login`; accounts are provisioned by the backend seed, with no self-registration |
| Theme | Light/dark toggle implemented in the admin SPA, persisted in `localStorage`. The current production build is `assets/index-DwFFOLMM.js` with `assets/index-C8Rh47uc.css`; as of 2026-10-28 the live host still serves the previous admin bundle (`index-BR1LMIVW.js`) until the upload below is run. |
| Backend redeploy | **Required** for the product-image work (backend Phase 5, `CAT-B01`/`CAT-B02`): the API stores uploaded files on the `product-images` disk (`storage/app/product-images`) and serves them through `GET /api/v1/media/product-images/{productId}/{filename}`. No new environment variable and no schema migration; `storage/app/product-images` must exist and be writable. |

The deployment is a **demo**, not a production commerce service. Payment remains simulated, data is fictional,
and the security limitations in [`SECURITY.md`](SECURITY.md) and [`SECURITY_REVIEW.md`](SECURITY_REVIEW.md)
still apply.

## Upload packages (2026-10-28)

The current build is packaged locally under `output/` (generated, `.gitignore`d; the source of truth is
the repository plus `npm run build`). Upload steps and per-package notes: `output/README.md`.

| Package | Size | Goes to |
|---------|------|---------|
| `output/eshopverse-full-deploy.zip` (complete `htdocs/` root, including `eshopverse_app/.env`) | 18.84 MB | `htdocs/` — replaces the whole deployment in one upload |
| `output/eshopverse_app.zip` (root folder `eshopverse_app/`) | 17.76 MB | `htdocs/` — extracts into the existing application directory |
| `output/eshopverse-admin.zip` (`index.html`, `assets/`, `fonts/` at the root) | 1.08 MB | `htdocs/` — overwrites the SPA files |

Build them with `deploy/build-release.sh` (bash) or `deploy/build-release.ps1` (Windows PowerShell).
The PowerShell script is the one used on the maintainer's machine, which has no bash.

### Full host bundle (2026-11-08)

`output/eshopverse-full-deploy.zip` is the archive to use when the host can only be replaced as a
whole rather than file by file. Its root is the complete `htdocs/` directory:

```text
index.php          Laravel front controller (deploy/byethost/htdocs/index.php)
.htaccess          API + SPA rewrites, denies direct .env access
index.html         admin SPA (public /privacy and /terms included)
assets/            admin JS/CSS (index-DctyOm6T.js, index-BMo7PNKp.css)
fonts/             Lato
eshopverse_app/    Laravel application with vendor/ and .env
```

It contains no `tests/`, no local logs, no `bootstrap/cache` config, and no local `storage/` content.
`eshopverse_app/.env` comes from the generated `output/eshopverse-backend.env`
([Ready-to-deploy production `.env`](#ready-to-deploy-production-env)). That file is complete — the
live PostgreSQL connection, host origins, both Google client IDs, and a rotated `APP_KEY` are already
set — so the archive can be extracted as-is. Keep the `.env` from the deployed archive afterwards so the
key stays stable.

### Admin build with public legal pages (2026-11-08)

The Google OAuth consent screen links to `/privacy` and `/terms`, and the bundle deployed before this
date returns "Page not found" for both. Rebuild and redeploy the admin SPA so those public pages exist:

```powershell
Set-Location admin
npm.cmd run build
```

The resulting `admin/dist` bundle (`index.html`, `assets/index-DctyOm6T.js`,
`assets/index-BMo7PNKp.css`, `fonts/`) is packaged as `output/eshopverse-admin.zip`. Upload/extract it
over the existing `index.html`, `assets/`, and `fonts/` on the host, then hard-refresh and confirm:

- `https://eshopverse.wasmer.app/privacy` renders the privacy policy (no admin sign-in required);
- `https://eshopverse.wasmer.app/terms` renders the terms of service;
- `https://eshopverse.wasmer.app/login` still renders the admin sign-in.

No backend change or `.env` change is required for the legal pages.

Backend upload rules: `eshopverse_app.zip` does not contain `.env`, so never overwrite the host's
`htdocs/eshopverse_app/.env` when using that archive. The full bundle above does contain `.env`, so
fill its placeholders first. Keep the host's `storage/` content — in particular
`storage/app/product-images/` — and keep `storage/` and `bootstrap/cache/` writable. The archive ships
`vendor/` because `backend/composer.lock` changed on 2026-10-23 (`config.platform.php` pinned to
8.3.36) and the host cannot run Composer.

### Verification record (2026-10-28)

| Check | Result |
|-------|--------|
| Backend `php artisan test` | 196 tests / 2,362 assertions — 194 pass. The 2 failures exist only off MySQL: `DatabaseWorkflowTest` asserts the `mysql` driver and `AdminCategoryTest`'s duplicate-name case relies on the MySQL column collation. Both pass in the repository's Backend Build & Test job on MySQL 8.4. `vendor/bin/pint --test` passes. |
| Host PHP compatibility | `composer.json` pins `config.platform.php` to 8.3.36, `vendor/composer/platform_check.php` requires PHP ≥ 8.3.0, and no PHP 8.4-only syntax is used — the build runs on the host's PHP 8.3. |
| Admin panel | `npm run typecheck`, `npm run lint`, `npm test` (11 files / 89 tests), `npm run check:contrast` (34/34) and `npm run build` all pass; the build reproduces `index-DwFFOLMM.js` exactly. |
| Live API smoke, host layout | 88/88 checks against a local mirror of this document's `htdocs/` layout (front controller + SPA + `eshopverse_app/`): `/up`, catalog reads and 404s, registration/login/profile, cart → quote → order (`Idempotency-Key` enforced) → simulated payment, admin session + CSRF (including token rotation), category/product/inventory/order administration, order status chain `confirmed → processing → shipped → delivered` with `409 INVALID_TRANSITION` afterwards, image upload → public read → delete, Google `500` fail-closed with the explicit log line, and every SPA route. |
| Admin browser walkthrough | Sign-in with the seeded administrator, products/categories/inventory/orders rendering live API data, theme toggle switching and persisting across reload; no console or network errors beyond the expected guest `401` on `/api/v1/admin/auth/session`. |

### Full-stack verification record (2026-11-08)

Run against the public deployment (`https://eshopverse.wasmer.app`), the live PostgreSQL database, and
the debug APK installed on a Samsung SM-A125F running Android 12.

| Check | Result |
|-------|--------|
| Public endpoints | `/up`, `/api/v1/categories`, `/api/v1/products`, `/api/v1/products/{id}`, `/login`, `/privacy`, `/terms` all `200` |
| Live API smoke suite | 33/33 checks: catalog list/filter/search/detail/404, guest `401` guards, register `201` / duplicate `409`, login (case-insensitive) / wrong password `401`, profile `GET`+`PATCH`, cart add + merge + update + unknown product `404`, checkout quote + validation `422`, order create `201` + idempotent replay + missing `Idempotency-Key` `400`, payment `200`, orders list/detail, logout `204`, post-logout `401`, Google forged token `401` / missing token `422`, admin `401`. The suite creates and deletes its own customer, order, and inventory change; `users` returned to 18 rows |
| Product images | 50/50 stored URLs answer `200 image/webp` through the CDN; 0 products without an image row; 0 blank URLs; list and detail payloads return the new URLs |
| Android build | `:app:assembleDebug` and `:app:testDebugUnitTest` — BUILD SUCCESSFUL |
| Android on device | Fresh debug APK launches, reaches the live API over HTTPS (`GET /api/v1/cart` → expected guest `401`), and renders the catalog with images, prices, categories, and bottom navigation |
| Google account picker | Opens with the signed-in Google Account; the request reaches `POST /api/v1/auth/google` |
| Google ID-token claims (on device) | `iss=https://accounts.google.com`, `email_verified=true`, `aud` = the `eshop-verse` **Web** client, `azp` = the `eshop-verse` Android client — i.e. exactly the audiences the shipped `.env` trusts |
| Host clock | ~1 s skew, so token `exp`/`nbf` checks are not the cause of a rejection |

At the time of this record the host still ran the **previous** `.env`, so `POST /api/v1/auth/google`
answered `401 INVALID_CREDENTIALS` for a genuine token whose audience matched the configuration above.
A misconfigured or empty audience returns `500`, and a JWKS/network failure also returns `500`, so the
`401` isolates the cause to the host's audience value. Replacing the host `.env` with the generated file
(which sets `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_IDS`) is the remaining step; re-test "Continue with
Google" on the device afterwards.

## Why the admin and API share one origin

The admin uses Laravel Sanctum's first-party SPA session (HttpOnly `eshop_admin_session` cookie plus the
echoed `XSRF-TOKEN` cookie). Serving the SPA and API from the same HTTPS origin keeps the session cookie
first-party and removes cross-origin configuration risk.

ByetHost's free hosting also serves a short JavaScript browser challenge. A normal browser passes it
automatically, but a server-side proxy (for example a Cloudflare Pages worker) cannot. The working layout is
therefore:

- admin static files + Laravel front controller in `htdocs/`;
- Laravel application code in `htdocs/eshopverse_app/`;
- no Cloudflare Pages proxy in front of the API.

The admin source no longer ships a Cloudflare `_worker.js`; it was removed because the same-origin ByetHost
layout is the working deployment and the worker cannot pass the host challenge.

## File layout on the host

```text
htdocs/
├── index.php              # Laravel front controller (repo: deploy/byethost/htdocs/index.php)
├── .htaccess              # API/health routes + SPA fallback (repo: deploy/byethost/htdocs/.htaccess)
├── index.html             # admin SPA entry (generated by `npm run build`)
├── assets/                # hashed JS/CSS bundles
├── fonts/                 # self-hosted Lato TTFs + OFL license
└── eshopverse_app/        # Laravel application (vendor/, .env, storage/, bootstrap/cache/)
    └── .htaccess          # denies direct web access to the Laravel directory
```

`deploy/byethost/htdocs/index.php` auto-detects either supported layout:

- `htdocs/index.php` + `htdocs/eshopverse_app/` (current), or
- `htdocs/index.php` + sibling `eshopverse_app/`.

The root `.htaccess` rewrites `/api/*` and `/up` to `index.php`, serves real files (admin assets, fonts), and
falls back to `index.html` for React Router paths such as `/products`. It also denies direct access to
`.env` files.

## Required production settings

These values live only in the host `.env` (git-ignored locally). The checked-in
`backend/.env.example` documents every variable; the ready-to-deploy file described in
[Ready-to-deploy production `.env`](#ready-to-deploy-production-env) already contains the live host
values.

| Variable | Production value / guidance |
|----------|-----------------------------|
| `APP_ENV` | `production` |
| `APP_DEBUG` | `false` |
| `APP_URL` | `https://eshopverse.wasmer.app` |
| `DB_CONNECTION` | `pgsql` (the Laravel driver name for PostgreSQL; `postgres` is not a valid driver name) |
| `DB_HOST` / `DB_PORT` / `DB_DATABASE` / `DB_USERNAME` / `DB_PASSWORD` | PostgreSQL instance values — see [Database of record](#database-of-record-2026-11-08); never commit the password |
| `SESSION_DRIVER` | `database` |
| `SESSION_SECURE_COOKIE` | `true` behind HTTPS |
| `SESSION_DOMAIN` | `null` for this single-host layout |
| `SANCTUM_STATEFUL_DOMAINS` | `eshopverse.wasmer.app` (add the port only for local development) |
| `CORS_ALLOWED_ORIGINS` | `https://eshopverse.wasmer.app` |
| `GOOGLE_CLIENT_ID` | `629866052539-50edn5o2jbjg449u5pjui72bnm4atojo.apps.googleusercontent.com` (the `eshop-verse` **Web application** client). Required for `POST /auth/google`; not a secret. Empty makes the endpoint fail closed with `500` plus an explicit log entry |
| `GOOGLE_CLIENT_IDS` | `629866052539-tsufikugav489t4rkg360ehmepsp9afm.apps.googleusercontent.com` (the `eshop-verse` **Android** client). Optional, comma-separated list of additional trusted audiences; the Android client is listed so a build that requests its ID token for the Android client is still accepted |
| `DEMO_ADMIN_PASSWORD` | Private demo value used when seeding; leave empty to auto-generate; never commit it or place it in docs |
| `APP_KEY` | Generated once on the host with `php artisan key:generate` when the app was prepared; keep the same key or sessions/cookies invalidate |

### Database of record (2026-11-08)

The public demo runs on a **PostgreSQL 17.11** instance hosted by Wasmer, not MySQL. The schema and
queries are portable — the framework's schema builder, `LOWER(email)` comparisons, and all 17
migrations work unchanged — and every migration is already applied on that instance.

| Item | Value |
|------|-------|
| Engine | PostgreSQL 17.11 (x86_64 Linux) |
| Host / port | `psql.fr-roub1.bengt.wasmernet.com` / `20184` |
| Database | `eshop_info_db` |
| User | `user_f09ea0ab` (password only in the host `.env`) |
| Schema | 20 tables, `search_path=public` |
| Migrations | 17/17 applied (latest `2026_10_23_000100_normalize_user_emails`) |
| Data at verification | 18 users, 50 products, 15 categories, 171 orders |
| Driver tables | `sessions`, `cache`, `cache_locks`, `jobs`, `job_batches`, `failed_jobs` all present, so the database session/cache/queue drivers are safe |

Verification used the exact production `.env` with `php artisan migrate:status --env=prod` against this
instance: exit code 0 and all 17 migrations reported `Ran`.

> This differs from the MySQL decision recorded in the backend architecture table. The demo's host
> provides PostgreSQL, and the application code was verified to run on it unchanged; if the project
> wants to make that permanent, it needs an ADR rather than a silent documentation change.

### Catalog image hosting (2026-11-08)

All 50 demo products have exactly one row in `product_images`. The seeded URLs originally pointed at
`raw.githubusercontent.com`, which some networks block or throttle; the API stayed healthy but Android
cards rendered empty image viewports. The rows now point at the jsDelivr CDN mirror of the same
commit-pinned files:

```text
https://cdn.jsdelivr.net/gh/Averon-Labs/eshop-verse@4507bb9808201f8c888944f7fe24e33064052c18/android/app/src/main/assets/products/<file>.webp
```

Each URL was checked live: 50/50 answered `200` with `Content-Type: image/webp`, and the public API now
returns the new URLs in both the list and detail payloads. The URL is pinned to a commit, so the bytes
cannot change under the demo. This was a data-only change — no migration, code, or `.env` value changed
— and it is already applied to the live database. Admin uploads are unaffected: they still use
`ProductImageStorage` and are served from the API host.

The equivalent statement, if the rows ever need to be restored or re-pointed:

```sql
update product_images
set url = replace(url,
      'https://raw.githubusercontent.com/Averon-Labs/eshop-verse/4507bb98',
      'https://cdn.jsdelivr.net/gh/Averon-Labs/eshop-verse@4507bb98');
```

### Ready-to-deploy production `.env`

`output/eshopverse-backend.env` (generated, `.gitignore`d — never commit it) is a **complete**
production environment file: all 56 variables from `backend/.env.example`, with the live host values,
the PostgreSQL connection above, the published Google Web client ID, `APP_ENV=production`,
`APP_DEBUG=false`, `LOG_LEVEL=warning`, and `SESSION_SECURE_COOKIE=true`. Nothing needs editing before
upload.

`APP_KEY` is a freshly generated 32-byte key. Rotating it invalidates existing session cookies, so
administrators and customers sign in again once; nothing is encrypted with the key in this deployment
(`SESSION_ENCRYPT=false`), so no data is lost. Keep the value from the deployed file stable afterwards.

`DEMO_ADMIN_PASSWORD` stays empty: no new administrator is created and no existing password changes.
`DB_SSLMODE` is commented out and defaults to `prefer`, which negotiates TLS when the server offers it.

Deploy it by backing up the current host `.env`, uploading this file as
`htdocs/eshopverse_app/.env` (UTF-8, no BOM), then clearing cached configuration
(`php artisan config:clear`, or `config:cache` if the host caches) and restarting the app. Verify with
`GET /up` (`{"status":"up"}`) and `GET /api/v1/products` (`200`).

### Google Sign-In client ID

`POST /api/v1/auth/google` is disabled until a Google OAuth client ID is configured. The API is the
only verifier: it checks the ID token locally against Google's published keys, so no client secret is
stored in the backend.

#### Project of record (verified 2026-11-08)

The demo uses exactly one Google Cloud project. Do not create clients in, or copy IDs from, any other
project.

| Item | Value |
|------|-------|
| Project | `eshop-verse` (project number `629866052539`) |
| Web application client (server audience) | `629866052539-50edn5o2jbjg449u5pjui72bnm4atojo.apps.googleusercontent.com` |
| Android client | `629866052539-tsufikugav489t4rkg360ehmepsp9afm.apps.googleusercontent.com` |
| Android package | `com.averonlabs.eshopverse` |
| Debug signing SHA-1 | `0F:F9:A0:C3:87:03:B1:07:C2:6D:76:F2:10:FA:7E:74:2D:BD:C2:D8` |
| OAuth consent screen | External; **In production** since 2026-11-08, so any Google Account can sign in |
| Scopes | `openid`, `email`, `profile` only; no sensitive or restricted scopes |
| Privacy policy / Terms | `https://eshopverse.wasmer.app/privacy` / `https://eshopverse.wasmer.app/terms` |

Both the Android build (`defaultGoogleWebClientId` in `android/app/build.gradle.kts`, overridable with
the `GOOGLE_WEB_CLIENT_ID` Gradle property) and the host `.env` (`GOOGLE_CLIENT_ID`) must use the
**Web application** client ID above. The Android client only lets Google Play services recognise the
APK; it is not the ID-token audience.

> **Historical warning.** Earlier builds and `RELEASE_NOTES_2026-11-03.md` referenced the Web client
> `702430048689-...apps.googleusercontent.com` from a different Cloud project. That project is not
> accessible to the current owner account and must not be used again. Mixing the two projects produces
> a `401 INVALID_CREDENTIALS` response from `POST /api/v1/auth/google` or a
> `[28444] Developer console is not set up correctly` error in the app.

To provision a replacement deployment from scratch:

1. Open Google Cloud Console, select the **`eshop-verse`** project, and go to
   **APIs & Services → Credentials**.
2. Choose **Create credentials → OAuth client ID**, application type **Web application**. The Android
   app uses this Web client ID as its server client ID and ID-token audience; an Android-type or
   installed-app client ID is not accepted here (Google issues the ID token for the Web client, so its
   `aud` would not match).
3. For the web admin sign-in, add the deployed origin (`https://eshopverse.wasmer.app`) under
   **Authorized JavaScript origins**. Register the APK's package name and SHA-1 as an **Android**
   client in the same project.
4. Publish the OAuth consent screen (**Audience → Publish app**). The demo requests only
   `openid`/`email`/`profile`, so publishing does not require app verification. While the status is
   **Testing**, only the accounts listed under **Test users** can sign in.
5. Copy the **Client ID** (it ends with `.apps.googleusercontent.com`) exactly, without spaces, into
   `.env` on the host as `GOOGLE_CLIENT_ID=...`.
6. If other first-party clients (admin web panel, iOS) also request ID tokens, list their client IDs
   comma-separated in `GOOGLE_CLIENT_IDS=...`. A token is accepted when its `aud` claim matches any
   configured client ID.
7. Save `.env` through the host file manager. If the deployment caches configuration, rebuild that cache.

The Android OAuth client created for the app (package `com.averonlabs.eshopverse`, plus the debug and
release SHA-1 fingerprints registered in Google Cloud Console) is still required so Google Play services
can authenticate the app. It is **not** the token audience: keep both clients in the same project and use
the Web application client ID here and as the app's server client ID.

When `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_IDS` are both empty, the endpoint answers
`500 INTERNAL_ERROR`, writes `Google Auth failed: GOOGLE_CLIENT_ID is not configured in .env` to
`storage/logs/laravel.log`, and creates no account. That log line is the signal to fix this setting; it
never contains a token or credential.

The admin production build uses `admin/.env.production`:

```dotenv
VITE_API_BASE_URL=/api/v1
```

The relative path is intentional: the SPA and API are on the same origin. `admin/.env.example` keeps the
local `http://localhost:8000/api/v1` default for development.

## Database import

The live database was imported through phpMyAdmin from a SQL export generated from the backend migrations and
seeders. The migration files remain the schema source of truth; the seeded demo data is fictional.

For a fresh import:

1. Create the MySQL database and user in VistaPanel.
2. Open phpMyAdmin for that database.
3. Import the generated SQL export.
4. Put the same database name, user, password, and host in `eshopverse_app/.env`.
5. Verify the API returns products before opening the admin.

Do not run test migrations against the live database.

## Build and upload the admin update

From the repository root:

```powershell
Set-Location admin
npm ci
npm run typecheck
npm run lint
npm run check:contrast   # light + dark token pairs
npm test
npm run build
```

`npm run build` writes `admin/dist/`. The upload archive is created from the **contents** of `admin/dist`
so it extracts directly into `htdocs`. The current package is `output/eshopverse-admin.zip`; the earlier
`deploy/eshopverse-admin-dist.zip` name referred to the same layout and is no longer kept in the tree:

```text
output/eshopverse-admin.zip
├── index.html
├── assets/
└── fonts/
```

Upload steps:

1. In VistaPanel's file manager, back up the current `htdocs/index.html`, `htdocs/assets/`, and
   `htdocs/fonts/` if you want an easy rollback.
2. Upload `deploy/eshopverse-admin-dist.zip` into `htdocs`.
3. Extract it in `htdocs`, overwriting `index.html`, `assets/`, and `fonts/`.
4. Delete any old `htdocs/_worker.js` left from the earlier Cloudflare-oriented build; the new archive no
   longer includes it.
5. Confirm `htdocs/index.php` and `htdocs/.htaccess` are present. If they were removed, upload the copies
   from `deploy/byethost/htdocs/` (enable “Show hidden files” for `.htaccess`).
6. Do not extract `eshopverse_app` into `htdocs/public` or replace the Laravel directory; the backend is
   already deployed and unchanged.
7. Open `https://eshopverse.byethost8.com`, hard-refresh with `Ctrl+F5`, and sign in.

If the host still serves an old bundle, delete the old hashed files in `htdocs/assets/` after confirming the
new `index.html` references the new bundle.

## Verification checklist

| Check | Expected result |
|-------|-----------------|
| `GET https://eshopverse.byethost8.com/up` with `Accept: application/json` | HTTP 200 and `{"status":"up"}` (a browser navigation renders Laravel’s HTML health page) |
| `GET https://eshopverse.byethost8.com/api/v1/products` | JSON list of seeded active products |
| `GET https://eshopverse.byethost8.com/login` | Admin sign-in SPA loads; no 404 from the host |
| Sign in with the seeded administrator | Session cookie set; dashboard loads |
| Theme toggle | Switches light/dark immediately; reload keeps the saved choice; no light flash before paint |
| Browser console | No API/CORS/cookie errors |
| `GET /api/v1/admin/auth/session` after sign-out | `401 UNAUTHENTICATED` |

If the API returns `500`, inspect `htdocs/eshopverse_app/storage/logs/laravel.log` and confirm the `.env`
database values and `APP_KEY`. If assets load but routes 404, confirm `.htaccess` is present and the host
allows `mod_rewrite`.

## ByetHost notes and limitations

- **PHP version:** select PHP 8.3 or newer in VistaPanel. Laravel 13 does not run on PHP 8.2 or older.
- **No SSH:** use phpMyAdmin for the database and the file manager for uploads; there is no `artisan` shell.
- **Upload size:** free-hosting file-manager limits may require uploading `eshopverse-admin-dist.zip` rather
  than loose files. The current archive is about 1.07 MB.
- **Hidden files:** `.htaccess` is hidden by default; enable hidden-file display before renaming or uploading.
- **Writable directories:** `eshopverse_app/storage/` and `eshopverse_app/bootstrap/cache/` must be writable
  (755, or 777 only if the host requires it for the demo).
- **Browser challenge:** normal browsers pass it; server-side proxy tools do not. Keep the API same-origin.
- **Free-hosting availability:** the demo can be suspended or rate-limited by the host; this is not a
  production SLA.

## Rollback

1. Restore the previous `htdocs/index.html`, `htdocs/assets/`, and `htdocs/fonts/` backup.
2. Keep `htdocs/index.php`, `htdocs/.htaccess`, and `htdocs/eshopverse_app/` unchanged.
3. Hard-refresh the browser.

The theme update changes only the admin frontend. Rolling it back does not affect the database or API.

## Related records

- [UI-003 in the Admin Roadmap](ADMIN_ROADMAP.md) — theme task, acceptance criteria, and verification record.
- [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) — admin light/dark tokens and toggle behavior.
- [SCREEN_SPECIFICATIONS.md](SCREEN_SPECIFICATIONS.md) — admin shell and sign-in screen details.
- [HANDOFF.md](HANDOFF.md) — reviewer setup and screen walkthrough.
- [SECURITY_REVIEW.md](SECURITY_REVIEW.md) — browser-storage and non-production boundaries.
