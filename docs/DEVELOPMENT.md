# Development Guide

## Repository Setup

### Prerequisites

- Git
- For Android development: Android Studio, JDK 17+
- For Backend development: a PHP release supported by the selected Laravel stable release, MySQL 8.x, and Composer
- For Admin development: Node.js LTS and npm

### Clone and Setup

```bash
git clone https://github.com/Averon-Labs/eshop-verse.git
cd eshop-verse
```

### Component-Specific Setup

Each component has its own setup process. The source code and actual dependency versions remain authoritative. See:

- `android/` — Java/XML Android application in Android Studio
- `backend/` — Laravel API; configure local environment from `.env.example` and use migrations against a disposable local database
- `admin/` — React/TypeScript client; configure its API origin without committing credentials

Before a component is implemented, document its exact setup, build, lint, and test commands here. Do not invent commands in task prompts; copy them from the current project scripts/tooling.

---

## Conventions

All branching, commit, PR, testing, and agent workflow conventions are defined in [`AGENTS.md`](../AGENTS.md). Do not duplicate them here.

---

## Local Development

### Android

**Prerequisites:** JDK 17 or later, Android SDK Platform 36.1 (API 36 extension level 1), and Android SDK Build Tools 36.0.0. The Gradle Wrapper files in `android/gradle/wrapper/` must be present in the checkout.

**Android commands:**

From PowerShell at the repository root:

```powershell
Set-Location android
.\gradlew.bat --version
.\gradlew.bat clean assembleDebug
.\gradlew.bat lintDebug
.\gradlew.bat testDebugUnitTest
```

For a connected-device instrumentation run, use `.\gradlew.bat connectedDebugAndroidTest` from `android/` with an emulator or device available. This requires a running emulator or physical device and is not included in CI.

To use Android Studio, open the `android/` directory and sync Gradle. Run the app on an emulator or device after the local checks pass.

**Current Configuration:**
- Language: Java/XML
- Namespace and application ID: `com.averonlabs.eshopverse`
- Compile SDK: 36.1 (API 36 extension level 1)
- Min SDK: 25
- Target SDK: 36
- Java source/target: 11
- Android Gradle Plugin: 9.2.1
- Gradle wrapper: 9.4.1

**Dependencies** (Phase 0-2 complete set declared in FND-006):
- Material Components: 1.14.0
- AndroidX AppCompat: 1.8.0
- AndroidX Activity: 1.13.0
- AndroidX Core: 1.18.0 (compatible with Compile SDK 36.1)
- ConstraintLayout: 2.2.2
- Navigation: 2.10.2
- Lifecycle: 2.11.0
- AndroidX Fragment: 1.9.1
- RecyclerView: 1.4.0
- SwipeRefreshLayout: 1.2.0
- Retrofit: 3.0.0 (with Gson converter)
- OkHttp: 5.3.0 (with logging interceptor and MockWebServer)
- Glide: 4.16.0 (compatible with Compile SDK 36.1)
- Testing: JUnit 4.13.2, Mockito 5.24.0, AndroidX Test JUnit 1.3.0, Espresso 3.7.0

**Verification status (2026-10-10):** local prerequisites include JDK 25, Android SDK Platform
36.1, and Build Tools 36.0.0. The owner chose to retain Compile SDK 36.1, so AndroidX Core 1.18.0
and Glide 4.16.0 are used instead of releases requiring API 37. From `android/`, the following
Windows command completed successfully (`BUILD SUCCESSFUL`, Gradle 9.4.1):

```powershell
.\gradlew.bat --no-daemon clean assembleDebug lintDebug testDebugUnitTest
```

The CI workflow declares the equivalent Linux commands (`./gradlew --no-daemon clean
assembleDebug`, `./gradlew --no-daemon lintDebug`, and `./gradlew --no-daemon testDebugUnitTest`)
on JDK 17, but a hosted CI run has not been observed yet. Instrumentation tests still require a
connected device/emulator and were not run. Gradle reports deprecated features that will be
incompatible with Gradle 10; the current Gradle 9.4.1 tasks pass. The executable bit of
`android/gradlew` in the Git index must be confirmed by the repository owner because Android-task
agents do not run Git commands.

All Android UI is Java/XML using the shared Material 3 design system in [`DESIGN_SYSTEM.md`](DESIGN_SYSTEM.md). Use the common app theme and shared resource tokens for each screen.

The launcher currently contains a clean application host (`HomeFragment`). Product screens and behavior are not implemented yet. The Gradle Wrapper JAR is tracked in Git.

**Known Limitation:** Release builds use `isMinifyEnabled = false` (R8/ProGuard disabled for the demo). This is acceptable for the first release but should be enabled for production.

Android Phase 0 also adds the layers the screen tasks depend on; their prerequisites are in [`android/PHASE-0-FOUNDATION-SPEC.md`](android/PHASE-0-FOUNDATION-SPEC.md) §B, and the per-task brief format is in [`android/TASK-BRIEF-TEMPLATE.md`](android/TASK-BRIEF-TEMPLATE.md).

### Backend

1. Install PHP dependencies with Composer.
2. Configure `.env` from `.env.example`.
3. Set up MySQL database.
4. Run migrations.
5. Start the development server.

> Exact commands will be documented when the Laravel application and test configuration are initialized.

> The OpenAPI contract draft lives at [`openapi.yaml`](openapi.yaml). It must be reviewed and accepted by the API owner before any endpoint, client integration, or migration is implemented.

### Admin Dashboard

1. Install the pinned Node.js/npm dependencies.
2. Configure the API origin for the local Laravel server.
3. Run the documented development, lint, and test commands.

> Exact commands will be documented when the React application and test configuration are initialized.

---

## Task and Agent Guidance

Follow [`AGENTS.md`](../AGENTS.md) for roadmap task selection, clarification, and agent-role assignment; it links the concise role guides. Use this document for component setup and verified commands. CI should run the required build, lint, unit, and integration/API checks; verify the checked-in workflow and repository settings before claiming they are active.
