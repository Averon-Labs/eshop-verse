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

Prerequisites: JDK 17 or later, Android SDK Platform 36.1 (API 36 extension level 1), and the Android SDK Build Tools version selected by Android Gradle Plugin 9.2.1. The Gradle Wrapper files in `android/gradle/wrapper/` must be present in the checkout.

From PowerShell at the repository root, verify the wrapper and run the scaffold checks:

```powershell
Set-Location android
.\gradlew.bat --version
.\gradlew.bat clean assembleDebug
.\gradlew.bat lint
.\gradlew.bat test
```

For a connected-device instrumentation run, use `.\gradlew.bat connectedDebugAndroidTest` from `android/` with an emulator or device available. The repository currently contains no JVM or instrumentation test source files, so `test` reports `NO-SOURCE`; instrumentation execution is not feature coverage and should be added with the first behavior that needs it.

To use Android Studio, open the `android/` directory and sync Gradle. Run the app on an emulator or device after the local checks pass.

Current scaffold configuration (recheck when build files change): Java/XML; namespace and application ID `com.averonlabs.eshopverse`; compile SDK 36.1; min SDK 25; target SDK 36; Java source/target 11; Android Gradle Plugin 9.2.1; Gradle wrapper 9.4.1; Material Components 1.10.0. AGP 9.2 requires JDK 17 and Gradle 9.4.1; its documented maximum API is 37.0. Install Android SDK Platform 36 and Build Tools 36.0.0 or the version required by the project. The regenerated scaffold also declares AppCompat 1.6.1, ConstraintLayout 2.1.4, Navigation 2.6.0, and AndroidX test dependencies from 2023; review their compatibility and whether they are all needed before implementation.

All Android UI is Java/XML using the shared Material 3 design system in [`DESIGN_SYSTEM.md`](DESIGN_SYSTEM.md). Use the common app theme and shared resource tokens for each screen.

The launcher currently contains only an empty app host. Product screens and behavior are not implemented yet. The documented Gradle commands were run against this scaffold: `clean assembleDebug` and `lint` passed; `test` completed with `NO-SOURCE` because no test source files exist. A clean-environment checkout and device-backed instrumentation run remain unverified.

### Backend

1. Install PHP dependencies with Composer.
2. Configure `.env` from `.env.example`.
3. Set up MySQL database.
4. Run migrations.
5. Start the development server.

> Exact commands will be documented when the Laravel application and test configuration are initialized.

### Admin Dashboard

1. Install the pinned Node.js/npm dependencies.
2. Configure the API origin for the local Laravel server.
3. Run the documented development, lint, and test commands.

> Exact commands will be documented when the React application and test configuration are initialized.

---

## Task and Agent Guidance

Follow [`AGENTS.md`](../AGENTS.md) for roadmap task selection, clarification, and agent-role assignment; it links the concise role guides. Use this document for component setup and verified commands. CI should run the required build, lint, unit, and integration/API checks; verify the checked-in workflow and repository settings before claiming they are active.
