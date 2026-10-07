# Project State

> Last updated: 2026-10-07

## Current Phase

**Phase 0 — Foundation**

## Status

| Component | Status | Notes |
|-----------|--------|-------|
| Repository structure | ✅ Established | Android scaffold and component guidance exist |
| Documentation | ⚠️ Foundation documented | `docs/ROADMAP.md` is the canonical phase and Task-ID backlog; exact component commands remain to be verified |
| Android app | ⚠️ Scaffold present | Java/XML scaffold and placeholder tests exist; no customer features. Gradle now declares Java 11 source, compile/target SDK 36, minSdk 25, AGP 8.13.2, and Gradle 8.13; local toolchain and build/test commands remain to be verified |
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
- Canonical backlog and Task-ID workflow recorded in `docs/ROADMAP.md`
- Gitflow-lite policy chosen: task PRs target `develop`; release PRs target `main`; owner reports GitHub default is now `develop`; automatic merged-head deletion was verified enabled; branch protection remains to be verified (GIT-001)
- Android scaffold configuration updated: Java 11 source compatibility, compile/target SDK 36, minSdk 25, AGP 8.13.2, Gradle 8.13; exact environment/build commands still need verification

## Next Steps

1. Finish GIT-001 by verifying branch protection and PR target settings against the documented workflow.
2. Complete Phase 0 Tasks FND-001 through FND-005 in `docs/ROADMAP.md`, respecting dependencies.
3. Get the OpenAPI contract reviewed before implementing any endpoint or client integration.
4. Begin Phase 1 only after Phase 0 exit criteria are verified.
