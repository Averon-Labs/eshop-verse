# Project State

> Last updated: 2026-10-07

## Current Phase

**Phase 0 — Foundation**

## Status

| Component | Status | Notes |
|-----------|--------|-------|
| Repository structure | ✅ Established | Android scaffold and component guidance exist |
| Documentation | ⚠️ Foundation documented | Project gates/shared tasks are in `docs/ROADMAP.md`; numbered canonical task steps are in the Android, Backend, and Admin roadmaps; verified component commands remain open |
| Android app | ⚠️ Scaffold regenerated | Java/XML scaffold recreated with namespace `com.averonlabs.eshopverse`, compile SDK 36.1, minSdk 25, targetSdk 36, Java 11, AGP 9.2.1, Gradle 9.4.1, Material Components 1.10.0; commands/build verification remain under FND-001 |
| Backend API | ⬜ Not initialized | `backend/` has guidance only; Laravel setup is FND-002 |
| Admin dashboard | ⬜ Not initialized | `admin/` has guidance only; React/TypeScript setup is FND-003 |
| API contract | ⬜ OpenAPI missing | `docs/API_CONTRACT.md` has shared conventions; `docs/openapi.yaml` and owner review are FND-004 |
| CI/CD | ⚠️ Placeholder | `.github/workflows/ci.yml` only validates repository structure; component checks are commented out |
| Database | ⬜ Not implemented | Logical model documented; migrations and isolated test database are part of backend/component Tasks |

## Active Branches

| Branch | Purpose | Owner |
|--------|---------|-------|
| main | Pre-policy baseline; future release target | — |
| develop | Shared integration branch; created from current `main` | — |

## Recent Decisions

- First-release portfolio scope and stack recorded in ADR-001
- Sequential build/test/debug workflow documented
- Canonical project gates and Task-ID index in `docs/ROADMAP.md`; component task details and numbered steps in `docs/ANDROID_ROADMAP.md`, `docs/BACKEND_ROADMAP.md`, and `docs/ADMIN_ROADMAP.md`
- Gitflow-lite policy chosen: task PRs target `develop`; release PRs target `main`; GitHub settings still need verification/configuration (GIT-001)
- Previous Android scaffold configuration: Java 8 source compatibility, minSdk 25, JUnit 4; superseded by the regenerated Android Studio scaffold recorded above.
- Android scaffold regenerated from Android Studio; package ID and toolchain values recorded from its Gradle files. All screen implementations must follow the shared Material 3 design system.
- Owner selected the supplied coral/neutral, Lato-based visual reference for Android and admin; DES-001 captures its scope, tokens, page specs, and excluded concepts.

## Next Steps

1. Complete Phase 0 tasks in their canonical roadmaps, respecting dependencies and the shared phase gate.
2. Get the OpenAPI contract reviewed before implementing any endpoint or client integration.
3. Begin Phase 1 only after Phase 0 exit criteria are verified.
