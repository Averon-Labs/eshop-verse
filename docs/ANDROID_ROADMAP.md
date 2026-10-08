# Android Roadmap

## Purpose and authority

Plan Android customer-app work in Java/XML using the documented MVVM, Repository, Material 3, and API boundaries.

This file is the canonical task list for its component. Each task appears once here; stable Task IDs identify work across branches and PRs. Project-wide phase gates and cross-component tasks are canonical in [ROADMAP.md](ROADMAP.md). Follow [repository-wide agent instructions](../AGENTS.md), component guidance, authoritative documents linked by the task, and the actual implementation.

A roadmap assignment uses this roadmap name, phase, and step, for example: Android Roadmap, Phase 1, Step 1; a stable Task ID may also identify the work. Step numbers restart at 1 in every phase. Lowercase letter labels restart at `a` in each acceptance-criteria block and identify individual criteria for discussion or verification, not separate assignments. Check dependencies before starting; a later step is not ready until its listed dependencies are complete. See [the project roadmap](ROADMAP.md) and [repository Git naming conventions](../AGENTS.md).

## Phase steps

## Phase 0 — Foundation

**Project phase gate:** see [Phase 0 in the Project Roadmap](ROADMAP.md).

### Step 1 — FND-001 — Verify Android scaffold and toolchain

**Status:** `[~]`

**Depends on:** none

**Scope:** inspect the regenerated Android Gradle project, reconcile its actual configuration with Android documentation, and keep its project layout and repository guidance aligned.

**Acceptance criteria:**

- [ ] **a.** Record the supported JDK, Android SDK/build-tools requirements, Gradle/Android Gradle Plugin versions, Java language level, namespace, and min/target SDK from the actual project; resolve the documented minSdk disagreement.
- [ ] **b.** Track the regenerated Android Studio project under `android/` without IDE state, local SDK paths, or generated build/cache files; preserve the rest of the repository.
- [ ] **c.** Ensure every Android XML screen is required to use the shared Material 3 theme, tokens, components, and reusable visual/state patterns documented in `docs/DESIGN_SYSTEM.md`.
- [ ] **d.** Remove Android Studio template-only sample content in the first implementation task before treating the scaffold as an application foundation; keep verification status open until build, lint, and test checks are run.
- [ ] **e.** Verify a clean setup, build, lint, JVM test, and any configured instrumentation-test commands; record exact commands and prerequisites in `docs/DEVELOPMENT.md`.
- [ ] **f.** Confirm the existing scaffold tests pass or record a reproducible failure; do not treat placeholder tests as feature coverage.
- [ ] **g.** Keep the app Java/XML and avoid changing product behavior in this foundation task.

**Verification:** fresh-environment Android build/lint/tests; compare the documented commands with the actual Gradle tasks and CI environment.

## Phase 1 — Accounts and Catalog

**Project phase gate:** see [Phase 1 in the Project Roadmap](ROADMAP.md).

### Step 1 — AUTH-002 — Android customer authentication and profile

**Status:** `[ ]`

**Depends on:** FND-001, AUTH-001, DES-001

**Scope:** English registration, sign-in, sign-out, profile, password-reset screens, API integration, and protected token persistence.

**Acceptance criteria:**

- [ ] **a.** Forms show field validation, loading, server errors, network errors, and success states in English.
- [ ] **b.** Tokens use platform-protected storage, are never logged, and are cleared on logout or rejected/expired session.
- [ ] **c.** Repository/ViewModel behavior is testable without Android framework dependencies where practical; critical UI flow has a focused UI test.
- [ ] **d.** UI uses XML/Material 3 and supports accessibility labels and keyboard/input types.

**Verification:** Android unit tests for state and storage behavior, API-client tests for mapped responses, and a focused instrumentation/UI test for the critical auth path.

### Step 2 — CAT-002 — Android catalog browsing

**Status:** `[ ]`

**Depends on:** FND-001, FND-004, CAT-001, DES-001

**Scope:** home/category browsing, product list/detail, search/sort, and API-backed image display.

**Acceptance criteria:**

- [ ] **a.** Customer can browse seeded products, open details, search, sort, and navigate categories using the reviewed API contract.
- [ ] **b.** Loading, empty, image failure, offline/server error, and retry states are handled.
- [ ] **c.** USD amounts are formatted consistently without binary floating-point calculations; all user-facing copy is English.
- [ ] **d.** ViewModel/repository mapping has unit tests and the main browse-to-detail path has a focused UI test.

**Verification:** Android unit/API mapping tests and a focused UI smoke test with deterministic responses or seed data.

## Phase 2 — Cart, Checkout, and Orders

**Project phase gate:** see [Phase 2 in the Project Roadmap](ROADMAP.md).

### Step 1 — CART-002 — Android cart experience

**Status:** `[ ]`

**Depends on:** FND-001, FND-004, AUTH-002, CAT-002, CART-001, DES-001

**Scope:** display and edit the signed-in customer's cart and recover from server conflicts.

**Acceptance criteria:**

- [ ] **a.** Customer can inspect items, update quantity, remove items, and see server-confirmed totals.
- [ ] **b.** Empty/loading/offline/error/stock-changed states are handled; retry does not silently duplicate a mutation.
- [ ] **c.** Cart state and money formatting are covered by unit tests; critical add/update/remove UI actions have focused UI coverage.

**Verification:** Android unit/API mapping tests and cart UI flow tests.

### Step 2 — CHECK-001 — Android checkout and simulated payment flow

**Status:** `[ ]`

**Depends on:** FND-001, FND-004, AUTH-002, CART-002, ORD-001, DES-001

**Scope:** signed-in address capture, order review, explicit demo outcome selection, and result display.

**Acceptance criteria:**

- [ ] **a.** Checkout validates required address fields, displays server-confirmed USD totals, and clearly labels the payment step as simulated.
- [ ] **b.** UI collects no card number, security code, or live payment credential.
- [ ] **c.** Success, failure, timeout, retry, and duplicate-submit states map correctly to server order state.
- [ ] **d.** Tests cover validation, state transitions, and safe retry/idempotency behavior.

**Verification:** Android unit/API mapping tests and a focused UI smoke test for success and failure outcomes.

### Step 3 — ORD-002 — Android order history and details

**Status:** `[ ]`

**Depends on:** FND-001, FND-004, AUTH-002, ORD-001, DES-001

**Scope:** customer-owned order list/detail and status display.

**Acceptance criteria:**

- [ ] **a.** Customer can view only their own orders and sees immutable item, address, USD total, payment result, and current status snapshots.
- [ ] **b.** Empty/loading/network/error states are handled with accessible English copy.
- [ ] **c.** Tests cover parsing, status display, and authorization/error handling.

**Verification:** backend ownership tests remain green; Android repository/ViewModel tests and order-history UI smoke test pass.

## Phase 3 — Quality and Portfolio Delivery

**Project phase gate:** see [Phase 3 in the Project Roadmap](ROADMAP.md).

### Step 1 — QUAL-001 — Component contribution

**Canonical task:** [QUAL-001 in the Project Roadmap](ROADMAP.md). The task scope, status, acceptance criteria, and verification record live only in that canonical entry.

**Component contribution:** Supply Android-side deterministic purchase-flow regression evidence and resolve Android-specific failures.

### Step 2 — QUAL-002 — Component contribution

**Canonical task:** [QUAL-002 in the Project Roadmap](ROADMAP.md). The task scope, status, acceptance criteria, and verification record live only in that canonical entry.

**Component contribution:** Review Android accessibility, responsive layouts, visual consistency, and screen states.

### Step 3 — QUAL-003 — Component contribution

**Canonical task:** [QUAL-003 in the Project Roadmap](ROADMAP.md). The task scope, status, acceptance criteria, and verification record live only in that canonical entry.

**Component contribution:** Review Android token storage, sensitive-data logging, client-side input handling, transport configuration, and dependency risks.

### Step 4 — QUAL-004 — Component contribution

**Canonical task:** [QUAL-004 in the Project Roadmap](ROADMAP.md). The task scope, status, acceptance criteria, and verification record live only in that canonical entry.

**Component contribution:** Verify Android setup, run commands, demo behavior, and limitations in the handoff guide.

### Step 5 — QUAL-005 — Component contribution

**Canonical task:** [QUAL-005 in the Project Roadmap](ROADMAP.md). The task scope, status, acceptance criteria, and verification record live only in that canonical entry.

**Component contribution:** Run documented Android checks from a clean checkout and report exact commands and outcomes.
