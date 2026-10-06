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
| HTTP Client | Retrofit (recommended) | PROPOSED |
| Image Loading | TBD | OPEN |
| DI | TBD | OPEN |

---

## Project Structure (Planned)

```
android/
├── app/
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/eshopverse/
│   │   │   │   ├── data/           # Data layer (repositories, models, API, Room)
│   │   │   │   ├── ui/             # UI layer (activities, fragments, viewmodels)
│   │   │   │   └── util/           # Utility classes
│   │   │   └── res/                # Resources (layouts, drawables, values)
│   │   ├── test/                   # Unit tests
│   │   └── androidTest/            # Instrumented tests
│   └── build.gradle
├── build.gradle                    # Project-level build config
├── settings.gradle
├── gradle.properties
└── AGENTS.md                       # This file
```

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
