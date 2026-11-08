# Release notes — 2026-11-08

Google Sign-In is fixed end to end: the app, the host, and the Google Cloud project now use the same
OAuth configuration, and the consent screen is published so any Google Account can sign up and sign in.

## Reported symptom

Nobody could complete Google sign-up or sign-in in the Android app. Google failures looked like a
password error because the Account tab rendered them through the password field (fixed in
[`RELEASE_NOTES_2026-11-03.md`](RELEASE_NOTES_2026-11-03.md)), but even after that, no Google account
completed the flow.

## Root causes (both had to be fixed)

1. **Wrong Google Cloud project.** The app and the host `.env` used the Web client
   `702430048689-...apps.googleusercontent.com`, while the Android client registered for the debug
   APK's package name and SHA-1 lives in a different project, `eshop-verse` (`629866052539`).
   Credential Manager only issues an ID token when the server client ID and the Android client are in
   the same project, so the app never received a usable token, and the host would have rejected a
   token minted for the wrong audience.
2. **Consent screen in Testing with zero test users.** The `eshop-verse` project's OAuth consent
   screen was **Testing**, which blocks every account that is not on the test-user list. Adding test
   users alone would not meet the requirement that anyone can sign in.

## Configuration of record

| Item | Value |
|------|-------|
| Google Cloud project | `eshop-verse` (`629866052539`) |
| Web application client (ID-token audience) | `629866052539-50edn5o2jbjg449u5pjui72bnm4atojo.apps.googleusercontent.com` |
| Android client | `629866052539-tsufikugav489t4rkg360ehmepsp9afm.apps.googleusercontent.com` |
| Package / debug SHA-1 | `com.averonlabs.eshopverse` / `0F:F9:A0:C3:87:03:B1:07:C2:6D:76:F2:10:FA:7E:74:2D:BD:C2:D8` |
| Consent screen | External, **In production** (published 2026-11-08) |
| Scopes | `openid`, `email`, `profile` — non-sensitive, so publishing needs no app verification |

## Changes

### Android app

- `android/app/build.gradle.kts` — `defaultGoogleWebClientId` now uses the `eshop-verse` Web client.
- `android/app/src/main/res/values/strings_auth.xml` — `default_web_client_id` matches, and the Google
  error strings are accurate.
- `android/app/src/test/java/.../auth/AuthConfigTest.java` — pins the Web client ID and its
  `.apps.googleusercontent.com` suffix so a future edit cannot silently point the app at another
  project.
- `GoogleAuthManager.clearCredentialState(...)` — sign-out now clears Google's stored credential state,
  so the next sign-in shows the account picker instead of auto-selecting the previous account. This
  makes "log out" meaningful for Google accounts.
- `AccountFragment` — calls `clearCredentialState` when the customer signs out.
- `GoogleAuthManagerTest` — covers the new clear-state delegation and completion behaviour.

### Backend

The Google verification code needed a real fix. Three defects found by the full-stack audit are fixed in
the shipped application code:

- **Live Google tokens were always rejected: Google's JWKS carries no certificates.** The verifier only
  built a public key from the JWK `x5c` certificate chain, but
  `https://www.googleapis.com/oauth2/v3/certs` currently publishes only the RSA `n` and `e` members, so
  every genuine ID token failed signature verification with `401 INVALID_CREDENTIALS` regardless of
  audience. `GoogleAuthService` now rebuilds the RSA public key from `n`/`e` (DER `SubjectPublicKeyInfo`)
  when no certificate is present, while still preferring `x5c` when a key set provides it. Verified
  against Google's two live keys — both reconstruct to the exact modulus and exponent — and covered by a
  regression test that serves Google's real JWKS shape. **This was the decisive Google sign-in blocker;
  the audience mismatch below was a second, independent one.**
- **Case-sensitive search on PostgreSQL.** The catalog and admin filters used `LIKE`, which is
  case-insensitive on MySQL but case-sensitive on PostgreSQL, so `q=bag` returned 0 products while
  `q=Bag` returned 3. `ProductController`, `AdminProductController`, and `AdminInventoryController` now
  use `whereLike(..., caseSensitive: false)`, which emits `ilike` on PostgreSQL and keeps the existing
  behaviour on MySQL. A regression test asserts the PostgreSQL and MySQL SQL shapes.
- **All rate limiters shared one bucket.** Every visitor was seen as the proxy address
  (`127.0.0.100`), so `auth-register` (5/hour), `auth-login` (10/minute), and `public-read`
  (120/minute) applied site-wide instead of per client — five sign-ups per hour for the whole demo.
  `bootstrap/app.php` now trusts the loopback proxy range, so `$request->ip()` is the forwarded client
  address. A regression test proves two forwarded clients get independent buckets.

The host environment value changes as well:

```dotenv
GOOGLE_CLIENT_ID=629866052539-50edn5o2jbjg449u5pjui72bnm4atojo.apps.googleusercontent.com
GOOGLE_CLIENT_IDS=629866052539-tsufikugav489t4rkg360ehmepsp9afm.apps.googleusercontent.com
```

`GOOGLE_CLIENT_ID` is the Web client whose `aud` Google puts on the ID token. The Android client is
listed as an additional trusted audience so a build that requests its token for the Android client is
not rejected.

### Product images

The Android catalog rendered product cards with empty image viewports because the 50 seeded image rows
pointed at `raw.githubusercontent.com`, which some networks block or throttle. The rows were re-pointed
at the commit-pinned jsDelivr mirror of the same files
(`https://cdn.jsdelivr.net/gh/Averon-Labs/eshop-verse@4507bb98…/android/app/src/main/assets/products/…`).
All 50 URLs answer `200 image/webp`, and the API now returns the new URLs. This is a data-only change in
the live database: no migration, code, or `.env` change, and admin uploads are unaffected.

### Google Cloud

- OAuth consent screen published from **Testing** to **In production**.
- Branding completed: app name `Eshop Verse`, support email, authorized domain
  `eshopverse.wasmer.app`, home page, privacy policy, and terms links.

### Admin / public legal pages

The consent screen links to `/privacy` and `/terms`. The deployed bundle returned "Page not found"
for both, so the admin SPA now serves real public `PrivacyPage` and `TermsPage` routes (no admin
sign-in required), covered by `admin/src/pages/LegalPages.test.tsx`.

## Verification

| Check | Result |
|-------|--------|
| `POST /api/v1/auth/google` with a short token | `422 VALIDATION_ERROR` — route live |
| Same endpoint with a malformed/forged token | `401 INVALID_CREDENTIALS` — verification runs, fail-closed |
| `GET /api/v1/products` | `200` |
| Google Auth Platform → Audience | **In production**, External |
| Android `testDebugUnitTest` (`GoogleAuthManagerTest`, `AuthConfigTest`) | passed |
| Android `assembleDebug` | passed; APK rebuilt with the new client ID |
| Admin `npm run typecheck`, `npm run lint` | passed |
| Admin `npm test` | 13 files / 98 tests passed |
| Admin `npm run build` | passed (`index-DctyOm6T.js`, `index-BMo7PNKp.css`) |
| Public deployment endpoints | `/up`, `/api/v1/categories`, `/api/v1/products`, `/api/v1/products/{id}`, `/login`, `/privacy`, `/terms` all `200` |
| Live API smoke suite | 33/33 checks passed, including register → login → profile → cart → quote → order (idempotent replay) → payment → logout; test data and inventory removed afterwards |
| Product images | 50/50 CDN URLs `200 image/webp`; no missing or blank rows |
| Android `assembleDebug` / `testDebugUnitTest` | BUILD SUCCESSFUL |
| Backend `php artisan test` (SQLite fallback) | 208 tests / 2,492 assertions — 205 pass, 1 skipped (the shipped-ID pairing test runs only when its IDs are exported), 2 failures are the documented engine-only cases (`DatabaseWorkflowTest` asserts the `mysql` driver; `AdminCategoryTest` duplicate-name relies on the MySQL collation). `vendor/bin/pint --test` passed |
| Google verifier vs the shipped client IDs | `aud` = Web client with `azp` = Android client → `201`, `aud` = Android client → `201`, any other client → `401` |
| Google verifier vs Google's real JWKS | both live keys (`n`/`e`, no `x5c`) reconstruct to the exact modulus and exponent and parse in OpenSSL |
| Admin auth surface | CSRF handshake `204`, missing CSRF `403 CSRF_TOKEN_MISMATCH`, wrong password `401 INVALID_CREDENTIALS`, guest session `401` |
| Android routes vs live API | all 22 endpoints the app declares answer with the contract status (public `200`, guarded `401`) |
| Android on device (SM-A125F, Android 12) | live catalog loads over HTTPS with images, prices, categories, and bottom navigation |
| Google ID token on device | `iss=https://accounts.google.com`, `email_verified=true`, `aud` = Web client, `azp` = Android client |
| Live catalog search | `q=bag` → 0 / `q=Bag` → 3, reproducing the PostgreSQL case-sensitivity defect now fixed in the bundle |

## Operator actions still required

1. **Host `.env` / full bundle:** upload `output/eshopverse-full-deploy.zip` (SHA-256
   `3A0C076890481AB13B8BC22ACA84F0C59C102C78CFEE618A7E0F9F809E6412EF`, 19,766,181 bytes / 18.85 MB) to
   `htdocs/`. Back up `htdocs/eshopverse_app/storage/` first, extract over the existing tree, keep the
   extracted `eshopverse_app/.env`, and clear cached configuration. The archive contains the complete
   PostgreSQL connection, the live origins, both Google client IDs, the Google JWKS fix, the search and
   trusted-proxy fixes, and a rotated `APP_KEY`, so existing sessions sign in again once. Details:
   [`DEPLOYMENT.md`](DEPLOYMENT.md#full-host-bundle-2026-11-08) and
   [`DEPLOYMENT.md`](DEPLOYMENT.md#ready-to-deploy-production-env).
2. **Legal pages:** the same bundle also ships the admin SPA build, so `/privacy` and `/terms` stop
   returning 404. Only `output/eshopverse-admin.zip` is needed if the host is updated file by file.
3. **APK:** install the rebuilt `android/app/build/outputs/apk/debug/app-debug.apk` on test devices and
   complete "Continue with Google" once the host `.env` is in place.

Product images need no operator action — the live `product_images` rows already point at the CDN.

## Known limitation

The host `.env` had not been replaced when this audit ran, so `POST /api/v1/auth/google` still returned
`401 INVALID_CREDENTIALS` for a genuine device-minted token. Two independent defects explain it and both
are fixed in the bundle: the host's audience value did not match the token's `aud`, and the verifier
rejected Google's certificate-less JWKS. Replacing `htdocs/eshopverse_app/.env` with the generated file,
extracting the new code, and clearing cached configuration is the only remaining step; re-test "Continue
with Google" on the device afterwards.

A password walk-through on the device could not be automated because `adb shell input text` drops and
duplicates characters on this handset; the authenticated journey was verified through the live API
suite instead. Keyboard entry itself is not affected.
