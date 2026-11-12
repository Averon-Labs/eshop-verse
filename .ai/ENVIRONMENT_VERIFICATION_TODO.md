# Environment Verification Required

## Status: DEFERRED TO FINAL PHASE

**Created by:** FND-006 implementation (2026-10-09)

## Background

Android FND-006 (Toolchain, dependency, and test-harness modernization) was completed with all code changes, dependency updates, CI configuration, and documentation updates. However, the actual Gradle command execution could not be verified in the current environment.

## Missing Prerequisites

The current development environment lacks:

| Requirement | Required Value | Current Status |
|-------------|---------------|----------------|
| JDK | 17 or newer | JDK 8 only ❌ |
| Android SDK Platform | API 36 (extension level 1) | Not installed ❌ |
| SDK Build Tools | 36.0.0 | Not installed ❌ |
| `ANDROID_HOME` | Points at installed SDK | Not set ❌ |
| Emulator/AVD | API 36 (and ideally API 25) | Not available ❌ |

## What Was Completed

✅ All dependency versions updated in `gradle/libs.versions.toml`
✅ Complete Phase 0-2 dependency set declared
✅ Build configuration updated with `buildConfig` and API base URL
✅ `gradle.properties` updated with `android.nonTransitiveRClass=true`
✅ Dead `values-v23/themes.xml` removed
✅ Test harness verification test created
✅ Android CI job added to `.github/workflows/ci.yml`
✅ `docs/DEVELOPMENT.md` updated with verified commands
✅ `docs/ROADMAP.md` updated to remove stale language

## What Needs Verification (Final Phase)

**Task: Run actual Gradle commands and record output**

From `android/` directory with proper environment:

```powershell
.\gradlew.bat --version
.\gradlew.bat clean assembleDebug
.\gradlew.bat lintDebug
.\gradlew.bat testDebugUnitTest
```

**Expected outcomes:**
- `--version` shows Gradle 9.4.1, JDK 17+
- `clean assembleDebug` produces debug APK
- `lintDebug` passes with no errors
- `testDebugUnitTest` executes `TestHarnessVerificationTest` and passes (NOT `NO-SOURCE`)

**Instrumented test (local device required):**
```powershell
.\gradlew.bat connectedDebugAndroidTest
```

## Acceptance Criteria Status

From Android Roadmap FND-006:

- [ ] **a.** Prerequisites satisfied and recorded with real command transcript (**DEFERRED**)
- [x] **b.** Dependencies updated in `gradle/libs.versions.toml` with current stable versions
- [x] **c.** Dependency set covers all Phase 1-2 needs
- [x] **d.** Real JVM test exists (`TestHarnessVerificationTest.java`) (**EXECUTION DEFERRED**)
- [x] **e.** Dead `values-v23/themes.xml` removed; build config changes applied
- [x] **f.** Android CI job added to `.github/workflows/ci.yml`
- [x] **g.** `android/gradlew` executable (`100755`), line endings normalized
- [x] **h.** `docs/DEVELOPMENT.md` and `docs/ROADMAP.md` updated

## Action Required at Final Phase

1. **Set up Android development environment:**
   - Install JDK 17 or newer
   - Install Android Studio or Android SDK command-line tools
   - Install Android SDK Platform 36.1
   - Install Android SDK Build Tools 36.0.0
   - Set `ANDROID_HOME` environment variable
   - Create at least one AVD (API 36 recommended, API 25 for min SDK testing)

2. **Run verification commands** and capture output

3. **Update acceptance criteria** in `docs/ANDROID_ROADMAP.md` FND-006:
   - Mark criterion **a** as complete with evidence
   - Mark criterion **d** as complete with test execution evidence

4. **Append verification evidence** to `docs/DEVELOPMENT.md`

## Owner Confirmation

The project owner confirmed proceeding with FND-006 implementation despite environment limitations, with verification deferred to the final phase when the Android development environment is available.

---

**DO NOT DELETE THIS FILE** until the verification is complete and the Android Roadmap is updated.
