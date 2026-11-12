# ADR-004: Defer Room Local Persistence for Initial Release

## Status

ACCEPTED

## Date

2026-10-10

## Context

Prior project documentation (`README.md`, `docs/ARCHITECTURE.md`) ambiguously marked Room local database persistence as `DECIDED`, yet no first-release requirement in the product roadmap specifies an offline database cache. Catalog browsing, cart operations, checkout, and order management are server-authoritative and depend on the REST API. Introducing a local relational SQLite/Room cache would require complex cache invalidation, offline sync reconciliation, and local migration management that provide no user benefit for the initial release.

## Options Considered

### Option A: Retain Room in Initial Release Scope

- **Pros:**
  - Provides offline access to previously fetched catalog data.
- **Cons:**
  - Adds schema maintenance, migration scripts, and entity-to-model mapping overhead.
  - Cart and stock management cannot operate offline because stock reservation and pricing are server-authoritative.
  - Stale cache risks showing out-of-date product availability or outdated prices.

### Option B: Defer Room for Initial Release

- **Pros:**
  - Aligns strictly with product requirements and Ponytail principles (strict YAGNI, minimal complexity).
  - Eliminates cache invalidation and database synchronization bugs.
  - Server remains the single authoritative source of truth for catalog, cart, and orders.
  - HTTP-level caching (via OkHttp/Retrofit) can provide sufficient network optimization where needed.
- **Cons:**
  - Offline catalog browsing is not supported in the initial release.

## Decision

Choose **Option B: Defer Room local database persistence for the initial release**.

The Android application will rely on direct REST API communication with the server as the single source of truth. Secure credentials will use `KeystoreTokenStore` (ADR-003). Documentation in `README.md`, `docs/ARCHITECTURE.md`, and `android/AGENTS.md` is updated to reflect this deferral.

If offline catalog capabilities are prioritized for future releases, Room will be reintroduced via a dedicated task with explicit offline synchronization requirements.

## Consequences

- Room dependencies are not included in `android/app/build.gradle.kts` for Phase 0–2.
- `docs/ARCHITECTURE.md` and `README.md` are aligned with the actual implementation.
- Build times and APK binary size are reduced.
