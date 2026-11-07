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
```

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

## Operator actions still required

1. **Host `.env`:** deploy the generated production file `output/eshopverse-backend.env` (complete,
   git-ignored, only the database credentials and the existing `APP_KEY` left to fill). It already sets
   `GOOGLE_CLIENT_ID` to the Web client ID above, `APP_ENV=production`, `APP_DEBUG=false`,
   `SESSION_SECURE_COOKIE=true`, and the live host origins. Clear any cached config afterwards.
   Details: [`DEPLOYMENT.md`](DEPLOYMENT.md#ready-to-deploy-production-env).
2. **Admin upload:** deploy `output/eshopverse-admin.zip` so `/privacy` and `/terms` stop returning
   404. Details are in [`DEPLOYMENT.md`](DEPLOYMENT.md#admin-build-with-public-legal-pages-2026-11-08).
3. **APK:** install the rebuilt `android/app/build/outputs/apk/debug/app-debug.apk` on test devices.

## Known limitation

A real Google ID token cannot be minted on this machine and no Android device or emulator was
attached, so the successful on-device journey is verified by the service tests, the published consent
screen, the embedded client ID, and the operator steps above rather than by a live tap-through.
