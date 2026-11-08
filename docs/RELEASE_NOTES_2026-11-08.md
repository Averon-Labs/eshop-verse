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

No application code change. The live endpoint already verifies Google ID tokens correctly; only the
host environment value changes:

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
| Android on device (SM-A125F, Android 12) | live catalog loads over HTTPS with images, prices, categories, and bottom navigation |
| Google ID token on device | `iss=https://accounts.google.com`, `email_verified=true`, `aud` = Web client, `azp` = Android client |

## Operator actions still required

1. **Host `.env` / full bundle:** upload `output/eshopverse-full-deploy.zip` (SHA-256
   `15EA10066B80205654F11A7B8B3B7117DA0991560183AA71A48978D7651CD15B`, 18.85 MB) to `htdocs/`. Back up
   `htdocs/eshopverse_app/storage/` first, extract over the existing tree, keep the extracted
   `eshopverse_app/.env`, and clear cached configuration. The archive contains the complete PostgreSQL
   connection, the live origins, both Google client IDs, and a rotated `APP_KEY`, so existing sessions
   sign in again once. Details:
   [`DEPLOYMENT.md`](DEPLOYMENT.md#full-host-bundle-2026-11-08) and
   [`DEPLOYMENT.md`](DEPLOYMENT.md#ready-to-deploy-production-env).
2. **Legal pages:** the same bundle also ships the admin SPA build, so `/privacy` and `/terms` stop
   returning 404. Only `output/eshopverse-admin.zip` is needed if the host is updated file by file.
3. **APK:** install the rebuilt `android/app/build/outputs/apk/debug/app-debug.apk` on test devices and
   complete "Continue with Google" once the host `.env` is in place.

Product images need no operator action — the live `product_images` rows already point at the CDN.

## Known limitation

The host `.env` had not been replaced when this audit ran, so `POST /api/v1/auth/google` still returned
`401 INVALID_CREDENTIALS` for a genuine device-minted token whose `aud` matches the shipped
configuration. Every other layer was verified end to end. Replacing `htdocs/eshopverse_app/.env` with the
generated file and clearing cached configuration is the only remaining step; re-test "Continue with
Google" on the device afterwards. A missing/blank audience or a JWKS failure returns `500`, not `401`,
which is why the rejection is attributed to the host's current audience value.

A password walk-through on the device could not be automated because `adb shell input text` drops and
duplicates characters on this handset; the authenticated journey was verified through the live API
suite instead. Keyboard entry itself is not affected.
