# Android Application — Agent Instructions

> Read the root `AGENTS.md` first. This file contains Android-specific rules.

---

## Architecture

| Aspect | Decision | Status |
|--------|----------|--------|
| Language | Java | DECIDED |
| UI | XML layouts with Material 3 | DECIDED |
| Architecture Pattern | MVVM (Model-View-ViewModel) | DECIDED |
| Data Layer | Repository Pattern | DECIDED |
| Local Database | Room (where appropriate) | DECIDED |
| Networking | REST API | DECIDED |
| HTTP Client | Retrofit | DECIDED |
| Image Loading | Glide | DECIDED |
| Dependency Injection | Constructor injection/manual wiring for the first release | DECIDED |
| Navigation | AndroidX Navigation | DECIDED |
| Compile SDK | 36 (`android/app/build.gradle.kts`) | DECIDED |
| Minimum SDK | 25 (`android/app/build.gradle.kts`) | DECIDED |
| Target SDK | 36 (`android/app/build.gradle.kts`) | DECIDED |
| Java source/bytecode compatibility | Java 11 (`android/app/build.gradle.kts`) | DECIDED |
| Namespace / application ID | `com.averonlabs.eshop_verse` (`android/app/build.gradle.kts`) | DECIDED |
| Android SDK Build Tools | AGP 8.13.2 default: 35.0.0; confirm the installed SDK tools during FND-001 | PENDING |
| Android Gradle Plugin | 8.13.2 (`android/gradle/libs.versions.toml`) | DECIDED |
| Gradle wrapper | 8.13 (`android/gradle/wrapper/gradle-wrapper.properties`) | DECIDED |

---

## Project Structure

Follow the checked-in Android Gradle scaffold and existing Java namespace. Organize new code by feature and layer without assuming a package path or replacing the Kotlin DSL Gradle files.

---

## Conventions

### Naming

- **Activities:** `<Feature>Activity.java` (e.g., `LoginActivity.java`)
- **Fragments:** `<Feature>Fragment.java` (e.g., `ProductListFragment.java`)
- **ViewModels:** `<Feature>ViewModel.java` (e.g., `CartViewModel.java`)
- **Repositories:** `<Feature>Repository.java` (e.g., `ProductRepository.java`)
- **Layouts:** `activity_<feature>.xml`, `fragment_<feature>.xml`, `item_<feature>.xml`
- **Drawables:** `ic_<name>.xml` for icons, `bg_<name>.xml` for backgrounds

### Code Style

- Follow standard Java conventions.
- Use meaningful variable and method names.
- Keep methods short and focused.
- Document public APIs with Javadoc.

### Resources

- Use string resources for all user-visible text.
- Use dimension resources for spacing.
- Use color resources defined in the design system.
- Support content descriptions for accessibility.

---

## Boundaries

- Android code lives exclusively in `android/`.
- Communication with the backend is through the REST API only.
- API models should mirror the API contract in `docs/API_CONTRACT.md`.
- Local Room entities may differ from API models.
- Do not embed backend logic in the Android app.

---

## Testing

- Unit tests in `app/src/test/`
- Instrumented tests in `app/src/androidTest/`
- See `docs/TESTING.md` for conventions.
- Add tests for new behavior with the implementation; the independent test agent verifies them afterward.
- Keep all user-visible UI and errors in English string resources.
