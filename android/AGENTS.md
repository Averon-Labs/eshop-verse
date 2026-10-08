# Android Application — Agent Instructions

> Read the root `AGENTS.md` first. This file contains Android-specific rules.

The canonical Android task steps, status, scope, dependencies, acceptance criteria, and verification are in [`docs/ANDROID_ROADMAP.md`](../docs/ANDROID_ROADMAP.md). Android assignments are executed and reported from that roadmap only; do not take on or list backend/admin work. Use [`docs/ROADMAP.md`](../docs/ROADMAP.md) only for explicitly cross-component work and final project/release validation. If an external task is a dependency, report it only as a blocker for the affected Android task.

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
| Namespace / application ID | `com.averonlabs.eshopverse` | DECIDED |
| Compile SDK | Android API 36, minor API level 1 | DECIDED |
| Target SDK | 36 | DECIDED |
| Minimum SDK | 25 | DECIDED |
| Java source/target | Java 11 | DECIDED |
| Android Gradle Plugin | 9.2.1 | DECIDED |
| Gradle wrapper | 9.4.1 | DECIDED |
| Material Components | 1.10.0 in the current scaffold | CURRENT SCAFFOLD; review before changing |

---

## Project Structure

Follow the checked-in Android Gradle scaffold and namespace `com.averonlabs.eshopverse`. Organize new code by feature and layer without replacing the Kotlin DSL Gradle files.

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
- Follow [`docs/DESIGN_SYSTEM.md`](../docs/DESIGN_SYSTEM.md) for every screen. Use the shared Material 3 theme, XML/View components, styles, and resource tokens; keep screen patterns visually consistent across the app.
- Follow the page-level flows and states in [`docs/SCREEN_SPECIFICATIONS.md`](../docs/SCREEN_SPECIFICATIONS.md); use the same specified palette, Lato type hierarchy, and reusable patterns throughout.
- Do not introduce one-off colors, spacing, typography, shapes, elevations, or custom component styles in individual screens. Propose changes centrally and update both the design-system guide and shared resources.
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
- Add tests for new behavior with the implementation.
- Keep all user-visible UI and errors in English string resources.
