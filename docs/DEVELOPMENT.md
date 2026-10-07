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

1. Open `android/` directory in Android Studio.
2. Sync Gradle.
3. Run on emulator or device.

Current scaffold configuration (recheck when build files change): Java/XML; namespace and application ID `com.averonlabs.eshopverse`; compile SDK 36.1; min SDK 25; target SDK 36; Java source/target 11; Android Gradle Plugin 9.2.1; Gradle wrapper 9.4.1; Material Components 1.10.0. AGP 9.2 requires JDK 17 and Gradle 9.4.1; its documented maximum API is 37.0. Install Android SDK Platform 36 and Build Tools 36.0.0 or the version required by the project. The regenerated scaffold also declares AppCompat 1.6.1, ConstraintLayout 2.1.4, Navigation 2.6.0, and AndroidX test dependencies from 2023; review their compatibility and whether they are all needed before implementation.

All Android UI is Java/XML using the shared Material 3 design system in [`DESIGN_SYSTEM.md`](DESIGN_SYSTEM.md). Use the common app theme and shared resource tokens for each screen.

The current source is still the Android Studio sample (navigation demo, placeholder fragments, and sample strings); it is not a completed customer app and its checks have not yet been verified.

> Exact commands will be documented when the Android build and test setup is verified.

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

## Agent Work Sequence

For each task, assign a Task ID from the canonical backlog in [`ROADMAP.md`](ROADMAP.md); its entry names the scope, acceptance criteria, and verification expectations. No separate task file is needed for ordinary backlog work. Follow the build → independent test → debug only if a failure is reproduced → independent retest sequence in the root [`AGENTS.md`](../AGENTS.md). Use the commands documented above for the initialized component, and report exact commands and outcomes. CI must run the project's required build, lint, unit, and integration/API checks before merge; branch protection should require those checks and review. Verify the actual workflow and repository settings before claiming those checks are active.
