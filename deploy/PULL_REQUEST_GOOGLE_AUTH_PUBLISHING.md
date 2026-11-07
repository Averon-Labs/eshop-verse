<!--
PR title: chore(android-p12-s03-auth-013): publish the EShop Verse Google OAuth configuration and a deploy-ready production env

Branch: feature/android-phase-12 → develop
Compare: https://github.com/Averon-Labs/eshop-verse/compare/develop...feature/android-phase-12?expand=1

This file IS the PR body. It contains no secrets: the production `.env` it describes is
generated locally under `output/` (git-ignored) and is never committed.
-->

## What this PR does

Google sign-up and sign-in did not work for anyone, and the deployed backend still pointed at the
wrong Google Cloud project. This PR fixes the app, publishes the OAuth consent screen, records the
configuration of record, adds the public legal pages the consent screen links to, and provides a
complete production environment file for the host.

**Three layers had to agree, and only one of them was correct.**

| Layer | Before | After |
|---|---|---|
| Google Cloud consent screen | Testing, 0 test users → every account blocked | **In production** (External) → any Google Account can authorize |
| Android app `serverClientId` | Web client from an inaccessible project (`702430048689-…`) | Web client from `eshop-verse` (`629866052539-…`) |
| Host `.env` `GOOGLE_CLIENT_ID` | Same wrong Web client | Same correct Web client (operator applies the new `.env`) |

## Root causes

1. **Split Google Cloud projects.** The app and the host used the Web client
   `702430048689-4gc06300mfqbf217l2ipp06nn14gtmla.apps.googleusercontent.com`, but the **Android**
   client registered for the APK's package name and debug SHA-1 lives in `eshop-verse`
   (project number `629866052539`). Credential Manager only issues an ID token when the server client
   ID and the Android client are in the same project, so the app never obtained a usable token; and
   the host would have rejected a token minted for an audience it did not know.
2. **Consent screen in Testing with zero test users.** Even a correct token was refused, because
   only accounts on the test-user list may authorize a Testing app.
3. **No real Google sign-out.** Signing out cleared only the backend bearer token. Credential Manager
   kept the previously chosen account, so the next sign-in auto-selected it and a customer could not
   switch Google accounts.
4. **Consent-screen links returned 404.** The Google branding form requires a home page, privacy
   policy, and terms link on the authorized domain; the deployed admin bundle answered "Page not
   found" for `/privacy` and `/terms`.

## Configuration of record (verified in Google Cloud Console, 2026-11-08)

| Item | Value |
|---|---|
| Project | `eshop-verse` — project number `629866052539` |
| Web application client (ID-token audience / server client ID) | `629866052539-50edn5o2jbjg449u5pjui72bnm4atojo.apps.googleusercontent.com` |
| Android client | `629866052539-tsufikugav489t4rkg360ehmepsp9afm.apps.googleusercontent.com` |
| Android package | `com.averonlabs.eshopverse` |
| Debug signing SHA-1 | `0F:F9:A0:C3:87:03:B1:07:C2:6D:76:F2:10:FA:7E:74:2D:BD:C2:D8` |
| Consent screen | External, **In production** since 2026-11-08 |
| Scopes | `openid`, `email`, `profile` only — no sensitive or restricted scopes |
| Verification | Not required (1 authorized domain, no logo, non-sensitive scopes only) |
| Branding | Name `Eshop Verse`; authorized domain `eshopverse.wasmer.app`; home `https://eshopverse.wasmer.app/`; privacy `/privacy`; terms `/terms` |

The console's Clients page lists exactly these two clients; Data Access lists no sensitive or
restricted scopes; Branding persists the URLs above.

## Changes by component

### Android (`6df0480`)

| File | Change |
|---|---|
| `android/app/build.gradle.kts` | `defaultGoogleWebClientId` now the `eshop-verse` Web client (still overridable with `-PgoogleWebClientId=…`) |
| `android/app/src/main/res/values/strings_auth.xml` | `default_web_client_id` matches the same client |
| `android/app/src/main/java/…/auth/GoogleAuthManager.java` | New `clearCredentialState(Executor, Runnable)`: calls `CredentialManager.clearCredentialStateAsync`, and always runs the completion callback so sign-out cannot hang if Google fails |
| `android/app/src/main/java/…/auth/AccountFragment.java` | Sign-out now calls `clearCredentialState`, so the next sign-in shows the account picker (real log out, switchable accounts) |
| `android/app/src/test/java/…/auth/AuthConfigTest.java` | **New.** Pins the Web client ID and its `.apps.googleusercontent.com` suffix so a future edit cannot silently retarget another project |
| `android/app/src/test/java/…/auth/GoogleAuthManagerTest.java` | Covers state clearing: delegation to Credential Manager, completion after success, completion after failure |

### Admin SPA (`07f1db5`)

| File | Change |
|---|---|
| `admin/src/pages/LegalPages.tsx` | **New.** Public `PrivacyPage` and `TermsPage` (privacy policy, terms of service) rendered outside `RequireAdmin`, reachable without an administrator account |
| `admin/src/App.tsx` | Public `/privacy` and `/terms` routes |
| `admin/src/pages/LegalPages.test.tsx` | **New.** Asserts both pages render for a guest session and contain the required sections |

### Backend

No application code change. The live endpoint already verifies Google ID tokens correctly
(signature, issuer, audience, expiry, verified email) and fails closed. **Only the host environment
value changes.**

### Deployment documentation (`00818ef`, plus this PR's docs commit)

| File | Change |
|---|---|
| `docs/DEPLOYMENT.md` | Live host (`eshopverse.wasmer.app`) and PHP runtime noted; ByetHost steps kept as history; project-of-record table; production settings table corrected to the live host; admin bundle redeploy steps; new **ready-to-deploy production `.env`** section |
| `docs/RELEASE_NOTES_2026-11-08.md` | **New.** Root causes, configuration, changes, verification, operator actions, limitations |
| `docs/RELEASE_NOTES_2026-11-03.md` | Marked superseded for Google configuration |
| `deploy/PULL_REQUEST.md` | Historical warning for the previous client ID |
| `deploy/PULL_REQUEST_GOOGLE_AUTH_PUBLISHING.md` | **New.** This PR body |

## Deploy-ready production `.env`

`output/eshopverse-backend.env` is generated locally (`.gitignore`d, never committed). It is a
complete production environment file — **all 56 variables** from `backend/.env.example`, parsed and
validated with `vlucas/phpdotenv` — with the final values already applied:

```dotenv
APP_NAME="EShop Verse"
APP_ENV=production
APP_DEBUG=false
APP_URL=https://eshopverse.wasmer.app
LOG_LEVEL=warning
SESSION_DRIVER=database
SESSION_SECURE_COOKIE=true
SESSION_DOMAIN=null
SANCTUM_STATEFUL_DOMAINS=eshopverse.wasmer.app
CORS_ALLOWED_ORIGINS=https://eshopverse.wasmer.app
DB_CONNECTION=mysql
DB_PORT=3306
GOOGLE_CLIENT_ID=629866052539-50edn5o2jbjg449u5pjui72bnm4atojo.apps.googleusercontent.com
GOOGLE_CLIENT_IDS=
SANCTUM_TOKEN_EXPIRATION=43200
```

Only host-held secrets remain as clearly marked placeholders, because they are not in the repository
and must not be:

| Placeholder | Action |
|---|---|
| `DB_HOST=CHANGE_ME_mysql_host` | Fill from the database provider |
| `DB_DATABASE=CHANGE_ME_database_name` | Fill |
| `DB_USERNAME=CHANGE_ME_database_user` | Fill |
| `DB_PASSWORD=CHANGE_ME_database_password` | Fill |
| `APP_KEY=base64:…` | **Keep the host's existing key** so administrator sessions stay valid; the shipped key is for a fresh install only (`php artisan key:generate --show`) |
| `DEMO_ADMIN_PASSWORD=` | Optional; empty auto-generates one on a new install |
| `DB_SSL_CA` (commented) | Uncomment with the provider CA path when MySQL requires TLS |

Validation performed on the generated file: 56/56 variables present, no extras, no duplicates,
`phpdotenv` parse OK, `APP_KEY` decodes to 32 bytes, `APP_ENV=production`, `APP_DEBUG=false`,
`SESSION_SECURE_COOKIE=true`.

## Verification evidence

| Check | Result |
|---|---|
| `POST /api/v1/auth/google` (short token) | `422 VALIDATION_ERROR` — route live, validation working |
| `POST /api/v1/auth/google` (malformed/forged JWT) | `401 INVALID_CREDENTIALS` — verification runs, fails closed (not `500`) |
| `GET /api/v1/products` | `200` |
| Google Auth Platform → Audience | **In production**, External, `1 user / 100 user cap` |
| Google Auth Platform → Clients | Exactly 2: Web + Android, both in `eshop-verse` |
| Google Auth Platform → Data access | No sensitive or restricted scopes |
| Google Auth Platform → Branding | Home / privacy / terms / domain persisted after save |
| Android `:app:assembleDebug` | passed; APK rebuilt |
| Android `:app:testDebugUnitTest` | passed (incl. `AuthConfigTest`, `GoogleAuthManagerTest`) |
| Android `:app:lintDebug` | passed |
| APK content check | correct Web client present, old `702430048689` ID absent |
| APK signer | `SHA-1 0F:F9:A0:C3:87:03:B1:07:C2:6D:76:F2:10:FA:7E:74:2D:BD:C2:D8` — matches the registered Android client |
| Admin `npm run typecheck` / `npm run lint` | passed |
| Admin `npm test` | 13 files / 98 tests passed |
| Admin `npm run build` | passed — `assets/index-DctyOm6T.js`, `assets/index-BMo7PNKp.css` |
| Admin `npm run check:contrast` | 34/34 checks pass |
| Admin bundle preview (`vite preview`) | `/privacy` renders "Privacy Policy" for a guest; `/terms` renders "Terms of Service" |
| `output/eshopverse-admin.zip` | 1,128,576 bytes — `index.html`, `assets/`, `fonts/` at the root |

## Operator actions after merge

1. **Host `.env` (critical).** Fill the four DB placeholders, keep the existing `APP_KEY`, upload as
   `htdocs/eshopverse_app/.env`, clear cached config, restart. Without the new `GOOGLE_CLIENT_ID`,
   Google sign-in returns `401` because the app now requests tokens for the `eshop-verse` audience.
2. **Deploy the admin bundle.** Upload and extract `output/eshopverse-admin.zip` over `index.html`,
   `assets/`, and `fonts/` so the consent-screen links stop returning 404. Then confirm
   `/privacy`, `/terms`, and `/login` all render.
3. **Rebuild/install the APK.** `android/app/build/outputs/apk/debug/app-debug.apk` contains the new
   client ID and the sign-out fix.

## Known limitations

- No Android device or emulator was attached and a real Google ID token cannot be minted locally, so
  the successful on-device journey is evidenced by the live endpoint behaviour, the published
  consent screen, the embedded client ID and signer match, and the service tests — not by a recorded
  tap-through.
- The host dashboard and the production database are not reachable from the development environment,
  so steps 1–2 above (and the final end-to-end confirmation) remain operator work.
- `/privacy` and `/terms` on the live host still return "Page not found" until the admin bundle in
  step 2 is deployed; the source, tests, and built bundle in this PR are ready.

## Commits

- `6df0480` — `fix(android-p12-s03-auth-013): use the eshop-verse Google client and clear credentials on sign-out`
- `07f1db5` — `feat(admin): add public privacy and terms pages for Google OAuth branding`
- `00818ef` — `docs(deploy): record the published eshop-verse OAuth configuration`

Everything above is scoped to the Google sign-in defect and its deployment. No schema, API-contract,
or security-control change; no new dependency; no secret committed.
