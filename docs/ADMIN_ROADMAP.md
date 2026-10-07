# Admin Roadmap

## Purpose and authority

Plan React/TypeScript dashboard work through the REST API, following shared dashboard design and session rules.

This file is the canonical task list for its component. Each task appears once here; stable Task IDs identify work across branches and PRs. Project-wide phase gates and cross-component tasks are canonical in [ROADMAP.md](ROADMAP.md). Follow [repository-wide agent instructions](../AGENTS.md), component guidance, authoritative documents linked by the task, and the actual implementation.

A roadmap assignment must include this roadmap name, phase, and step, for example: Admin Roadmap, Phase 1, Step 1; include a Sub-step only when the canonical task explicitly defines one. Step numbers restart at 1 in every phase, and Sub-step numbering restarts within its parent Step. Nested acceptance checklists remain criteria, not separate assignments. Check dependencies before starting; a later step is not ready until its listed dependencies are complete. See [the project roadmap](ROADMAP.md) for the Sub-step rule and [repository Git naming conventions](../AGENTS.md).

## Phase steps

## Phase 0 — Foundation

**Project phase gate:** see [Phase 0 in the Project Roadmap](ROADMAP.md).

### Step 1 — FND-003 — Initialize the admin application and local workflow

**Status:** `[ ]`

**Depends on:** none

**Scope:** create the React/TypeScript admin foundation; do not implement product workflows yet.

**Acceptance criteria:**

- [ ] Select supported stable tooling and commit the package lockfile; use the agreed Vitest and React Testing Library strategy or document a reviewed equivalent.
- [ ] Configure the API origin without committing credentials and document the local SPA/API origin arrangement needed for Sanctum cookies and CSRF.
- [ ] Provide a minimal app and a passing behavior-oriented test.
- [ ] Record and verify exact install, development, type-check/lint, test, and production-build commands in `docs/DEVELOPMENT.md`.
- [ ] Do not call or implement product endpoints before FND-004 is reviewed.

**Verification:** clean dependency install, baseline UI test, static checks, and production build.

## Phase 1 — Accounts and Catalog

**Project phase gate:** see [Phase 1 in the Project Roadmap](ROADMAP.md).

### Step 1 — AUTH-003 — Admin session authentication and API authorization

**Status:** `[ ]`

**Depends on:** FND-002, FND-003, FND-004, FND-005, DES-001

**Scope:** secure first-party admin sign-in/session lifecycle, Sanctum CSRF flow, and server-enforced admin role checks.

**Acceptance criteria:**

- [ ] Admin login/logout and session/CSRF behavior work with the documented local SPA/API origins and reviewed contract.
- [ ] Admin routes reject guests and customer accounts; tests verify role checks server-side, not only hidden UI controls.
- [ ] Session cookies use secure settings appropriate to local vs. HTTPS environments; no bearer token is stored in browser local storage for the admin SPA.
- [ ] Failure and expired-session UI states are visible and recoverable.

**Verification:** backend authentication/authorization feature tests and admin UI tests for login, logout, CSRF/session expiry, and rejected access.

### Step 2 — CAT-004 — Admin catalog and inventory screens

**Status:** `[ ]`

**Depends on:** FND-003, FND-004, AUTH-003, CAT-003, DES-001

**Scope:** React admin screens for product, category, and stock management through the REST API.

**Acceptance criteria:**

- [ ] Admin can list, create, edit, archive, and validate product/category data and update stock through documented APIs.
- [ ] Loading, empty, validation, conflict, unauthorized/session-expired, and network-error states are understandable and recoverable.
- [ ] Forms are keyboard accessible, have labels, and behave at supported narrow and desktop widths.
- [ ] Tests cover critical form behavior and API error mapping without depending on backend internals.

**Verification:** admin component/behavior tests and production build/type checks.

## Phase 2 — Cart, Checkout, and Orders

**Project phase gate:** see [Phase 2 in the Project Roadmap](ROADMAP.md).

### Step 1 — ORD-003 — Admin order management

**Status:** `[ ]`

**Depends on:** FND-003, FND-004, AUTH-003, ORD-001, DES-001

**Scope:** admin order list/detail and permitted status updates.

**Acceptance criteria:**

- [ ] Admin can inspect order snapshots and apply only documented valid state transitions.
- [ ] Server rejects unauthorized users and invalid transitions; tests cover both.
- [ ] Dashboard shows loading, empty, conflict, error, and updated status states.
- [ ] Admin tests verify behavior through API responses, not implementation details.

**Verification:** backend transition/authorization feature tests and admin behavior tests.

## Phase 3 — Quality and Portfolio Delivery

**Project phase gate:** see [Phase 3 in the Project Roadmap](ROADMAP.md).

### Step 1 — QUAL-001 — Component contribution

**Canonical task:** [QUAL-001 in the Project Roadmap](ROADMAP.md). The task scope, status, acceptance criteria, and verification record live only in that canonical entry.

**Component contribution:** Supply admin-side regression evidence and resolve admin-specific failures.

### Step 2 — QUAL-002 — Component contribution

**Canonical task:** [QUAL-002 in the Project Roadmap](ROADMAP.md). The task scope, status, acceptance criteria, and verification record live only in that canonical entry.

**Component contribution:** Review admin accessibility, keyboard behavior, responsive layouts, visual consistency, and screen states.

### Step 3 — QUAL-003 — Component contribution

**Canonical task:** [QUAL-003 in the Project Roadmap](ROADMAP.md). The task scope, status, acceptance criteria, and verification record live only in that canonical entry.

**Component contribution:** Review admin session/CSRF behavior, role boundaries, browser storage, error states, and dependency risks.

### Step 4 — QUAL-004 — Component contribution

**Canonical task:** [QUAL-004 in the Project Roadmap](ROADMAP.md). The task scope, status, acceptance criteria, and verification record live only in that canonical entry.

**Component contribution:** Verify admin setup, demo roles, workflows, and limitations in the handoff guide.

### Step 5 — QUAL-005 — Component contribution

**Canonical task:** [QUAL-005 in the Project Roadmap](ROADMAP.md). The task scope, status, acceptance criteria, and verification record live only in that canonical entry.

**Component contribution:** Run documented admin checks from a clean checkout and report exact commands and outcomes.
