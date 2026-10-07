# Product Delivery Roadmap and Task Backlog

## Purpose and source of truth

This file is the single, ordered backlog for delivering the first EShop Verse portfolio release. It contains the phases, individual Task IDs, dependencies, scope, acceptance criteria, and verification expectations. A phase describes a milestone; assign and complete one Task ID at a time.

Product boundaries are in [`PRODUCT.md`](PRODUCT.md), architecture choices in [`ARCHITECTURE.md`](ARCHITECTURE.md) and [`decisions/`](decisions/), shared UI rules in [`DESIGN_SYSTEM.md`](DESIGN_SYSTEM.md) and [`SCREEN_SPECIFICATIONS.md`](SCREEN_SPECIFICATIONS.md), API conventions in [`API_CONTRACT.md`](API_CONTRACT.md), and test/security rules in [`TESTING.md`](TESTING.md) and [`SECURITY.md`](SECURITY.md). Those documents define standards; this roadmap tracks implementation work and its completion.

Do not create a separate `.ai/tasks/<TASK-ID>.md` or `.ai/plans/<TASK-ID>.md` for ordinary roadmap work. Use those files only when a task has substantial persistent context that cannot fit here; link to the Task ID and do not copy its acceptance criteria.

## Project goal

Deliver a polished, end-to-end, single-store shopping demo for an international portfolio audience: an English-only Android customer app in Java/XML, a Laravel/MySQL REST API, and a React/TypeScript admin dashboard. Prices are sample USD amounts, data is fictional, and payment outcomes are simulated. This is not a production commerce launch.

## Branch and release model

- `develop` is the shared integration branch and intended GitHub default branch. Each Task gets one short-lived branch created from `develop` and a PR targeting `develop`; the builder, tester, and debugger for that Task use the same branch sequentially.
- Delete a task branch after its PR is accepted and merged. Merged task work remains in `develop`, so there is no need to retain all child branches until the phase ends. Keep `develop` permanently.
- At a phase/release boundary, complete the phase exit criteria and run the release checks on `develop`. A completed release moves to `main` only through a reviewed `develop` → `main` release PR; tag the released commit. Do not merge unfinished phase work to `main`.
- The current `main` already contains earlier merged bootstrap/documentation work and has no formal release tag. Preserve that history as the one-time pre-policy baseline; start the new policy prospectively and do not reset or rewrite `main` to make it look release-only.
- See the root [`AGENTS.md`](../AGENTS.md) for branch naming, PR, review, and cleanup rules. GitHub default-branch, auto-delete, and protection settings must match this policy; verify the actual remote settings rather than assuming Markdown changed them.

## Verified starting point

Last reviewed: 2026-10-07. Recheck the repository and current branch before starting each task.

- Android has a regenerated Java/XML Gradle scaffold: namespace/application ID `com.averonlabs.eshopverse`, compile SDK 36.1, `minSdk 25`, `targetSdk 36`, Java 11 source/target, AGP 9.2.1, Gradle 9.4.1, Material Components 1.10.0, and JUnit 4. Exact local prerequisites and verified build/test commands remain to be confirmed under FND-001. Android UI must follow the shared Material 3 design system in `docs/DESIGN_SYSTEM.md`.
- `backend/` and `admin/` contain agent guidance but no initialized applications.
- `.github/workflows/ci.yml` is a placeholder. Its only active job checks repository structure; Android, backend, and admin checks are commented out.
- GitHub `develop` has been created from the current pre-policy `main` baseline (`db8ff97`). The GitHub default branch, auto-delete option, and branch-protection settings still need verification/configuration under GIT-001.
- `docs/openapi.yaml` does not exist. `docs/API_CONTRACT.md` records shared conventions, but endpoint schemas and per-class rate limits remain open.
- `docs/DATABASE.md` is a logical model, not implemented migrations. The database and seed data still need implementation.

This is a repository snapshot, not a promise that the state remains unchanged. Confirm facts again when a Task starts.

## Status and completion rules

- Task status: `[ ]` not started, `[~]` in progress, `[x]` complete with evidence, `[!]` blocked with the reason recorded.
- Acceptance checkboxes are checked only after the task's implementation and verification evidence are reviewed.
- A task is complete when every acceptance criterion passes, required checks are green, and the reviewer has the exact commands, outcomes, and commit tested. Follow the Definition of Done in [`../AGENTS.md`](../AGENTS.md).
- If a task reveals a missing product or architecture decision, record the question and stop dependent work; do not silently broaden scope or contradict an accepted ADR.
- OpenAPI must be reviewed and accepted before implementing API endpoints or client integrations against them. The owner can review the proposed contract as a concrete artifact; no additional product choice is needed to prepare its first draft from the accepted scope.

## How to assign and run a task

Give the agent a Task ID and the relevant stage. It must read the root `AGENTS.md`, applicable component `AGENTS.md` files, this Task entry, and the linked source-of-truth documents; inspect current git status, branch, recent commits, and implementation before acting. You do not need to paste the project rules or acceptance criteria into each prompt.

Use the sequential workflow in [`../AGENTS.md`](../AGENTS.md): one builder, then an independent tester, then a debugger only for a reproduced failure, then the tester verifies the fix. Do not have these roles edit the same task simultaneously.

Example prompts (replace `AUTH-001` with the assigned ID):

- **Build:** “Implement `AUTH-001` from `docs/ROADMAP.md`. Follow repository and component instructions, stay within the task scope, add the required tests, and report changed files, assumptions, exact commands, results, and commit.”
- **Test:** “Independently verify `AUTH-001` from `docs/ROADMAP.md` at the builder's current commit. Do not change production code or weaken checks. Run the task's required checks, inspect each acceptance criterion, and report exact commands, results, and any reproducible failure.”
- **Debug:** “Investigate this tester-reproduced failure in `AUTH-001`. First reproduce it using the supplied evidence, inspect prior failed hypotheses, make the smallest root-cause fix in scope, add a regression test, and report the exact attempt and verification evidence. Do not retry an unchanged approach without new evidence.”
- **Retest:** “Independently verify the `AUTH-001` fix at its new commit: rerun the failing check, relevant neighboring checks, and the task-required suite. Report exact commands and outcomes.”

Pass the builder's tested state to the independent tester. If debugging is needed, pass the exact failure evidence and prior attempts to the debugger. The attempt-record format, no-identical-retry rule, and stop-after-three-hypotheses rule are defined once in the root [`AGENTS.md`](../AGENTS.md); the coordinator must pass that record between agents because unshared conversation history is not reliable evidence.

## Phase 0 — Foundation (current)

**Exit criteria:** all three components have repeatable, verified setup and check commands; the OpenAPI contract has been reviewed before endpoint work; CI runs the agreed component checks; GitHub's integration/release branch settings match GIT-001; the shared first-release UI specification is accepted before screen implementation; remaining choices that block the first customer-to-order flow are recorded and resolved.

### FND-001 — Verify Android scaffold and toolchain

**Status:** `[x]`

**Depends on:** none

**Scope:** inspect the regenerated Android Gradle project, reconcile its actual configuration with Android documentation, and keep its project layout and repository guidance aligned.

**Acceptance criteria:**

- [ ] Record the supported JDK, Android SDK/build-tools requirements, Gradle/Android Gradle Plugin versions, Java language level, namespace, and min/target SDK from the actual project; resolve the documented minSdk disagreement.
- [ ] Track the regenerated Android Studio project under `android/` without IDE state, local SDK paths, or generated build/cache files; preserve the rest of the repository.
- [ ] Ensure every Android XML screen is required to use the shared Material 3 theme, tokens, components, and reusable visual/state patterns documented in `docs/DESIGN_SYSTEM.md`.
- [ ] Remove Android Studio template-only sample content in the first implementation task before treating the scaffold as an application foundation; keep verification status open until build, lint, and test checks are run.
- [ ] Verify a clean setup, build, lint, JVM test, and any configured instrumentation-test commands; record exact commands and prerequisites in `docs/DEVELOPMENT.md`.
- [ ] Confirm the existing scaffold tests pass or record a reproducible failure; do not treat placeholder tests as feature coverage.
- [ ] Keep the app Java/XML and avoid changing product behavior in this foundation task.

**Verification:** fresh-environment Android build/lint/tests; compare the documented commands with the actual Gradle tasks and CI environment.

### FND-002 — Initialize Laravel API and local database workflow

**Status:** `[ ]`

**Depends on:** none

**Scope:** create the backend application foundation using the accepted Laravel/PHP/MySQL stack, without implementing product endpoints.

**Acceptance criteria:**

- [ ] Select supported stable framework/runtime versions and commit the dependency lockfile; document the selected versions.
- [ ] Provide safe local configuration instructions and `.env.example` placeholders; no real secrets are checked in.
- [ ] Configure migrations and a disposable isolated test database workflow; document how a developer creates and resets local data safely.
- [ ] Configure the backend unit/feature test runner and a minimal passing baseline test.
- [ ] Record and verify exact install, setup, migration, style/static-check, and test commands in `docs/DEVELOPMENT.md`.
- [ ] Do not add business endpoints before FND-004 is reviewed.

**Verification:** clean dependency install, disposable-database migration, and backend baseline test/checks.

### FND-003 — Initialize the admin application and local workflow

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

### FND-004 — Draft and review the OpenAPI contract

**Status:** `[ ]`

**Depends on:** none; must finish before any endpoint or client integration Task

**Scope:** create `docs/openapi.yaml` from the accepted product/API/database/security decisions and close the remaining contract decisions.

**Acceptance criteria:**

- [ ] Describe registration, login/logout, profile, and password-reset flows; public category/product listing, search, sorting, pagination, and product details; customer cart; order creation, history/detail, and simulated payment result; admin authentication, catalog/category/inventory management, and order-status management.
- [ ] Define request/response schemas, required/optional fields, validation constraints, status codes, shared error envelope, pagination, USD money representation, and representative examples.
- [ ] Define Android bearer-token and admin Sanctum session/CSRF security schemes, ownership/role expectations, and rate-limit classes/limits.
- [ ] Define order idempotency behavior, price/stock authority, order/address snapshots, and simulated payment success/failure state semantics consistently with `PRODUCT.md` and `DATABASE.md`.
- [ ] Resolve category lifecycle and product reassignment behavior: the roadmap mentions category archive, while the current logical category schema has no status field.
- [ ] Validate the document with a documented OpenAPI validator and record the exact validation command; resolve all errors.
- [ ] Obtain API-owner review/acceptance and update `API_CONTRACT.md` to link to the approved machine-readable contract without duplicating endpoint schemas.

**Verification:** OpenAPI validation plus a human review against the referenced product, architecture, database, and security documents. Endpoint implementation remains blocked until acceptance.

### GIT-001 — Establish the develop integration branch

**Status:** `[~]`

**Depends on:** none

**Scope:** establish the shared integration branch and align GitHub's branch workflow with the release policy without rewriting existing history.

**Acceptance criteria:**

- [x] Create `develop` from the current `main` baseline and preserve all existing merged history; do not force-push or reset `main`.
- [ ] Set `develop` as the GitHub default branch so new task PRs default to the integration branch.
- [ ] Configure GitHub to automatically delete merged task branches; keep `develop` and `main`.
- [ ] Protect `develop` and `main` from direct/force pushes and require PR review. Review `develop` → `main` as a release PR only.
- [ ] Open/re-target current in-flight work as a PR into `develop`; do not merge it automatically.

**Verification:** inspect live GitHub branch refs, default branch, PR base, deletion setting, and protection rules. Confirm `main` was not rewritten.

### FND-005 — Make setup documentation and CI match the real projects

**Status:** `[ ]`

**Depends on:** FND-001, FND-002, FND-003, FND-004, GIT-001

**Scope:** replace placeholder-only project checks with repeatable component checks and document what CI actually enforces.

**Acceptance criteria:**

- [ ] `docs/DEVELOPMENT.md` contains copyable setup/build/lint/static-check/test commands for Android, backend, admin, and OpenAPI validation; each command is verified against the checked-in tooling.
- [ ] Update `.github/workflows/ci.yml` to run the documented required checks for each initialized component on task PRs to `develop` and release PRs to `main`, using isolated test data and no committed secrets.
- [ ] Preserve failures as failures: do not skip, disable, or mask a required check to make CI green.
- [ ] Verify the workflow on a pull request or equivalent run and record its result. Inspect repository default-branch, auto-delete, and branch-protection settings against GIT-001; configure required status checks only after verifying their names, and document any setting that is not enforced.
- [ ] Remove stale “not initialized” comments/status once they are false; never claim a workflow or branch rule is active without evidence.

**Verification:** run the exact documented commands locally or in CI; inspect a successful workflow run and separately report any external branch-protection setting that remains unenforced.

### DES-001 — Define shared visual direction and first-release screen specifications

**Status:** `[~]`

**Depends on:** none

**Scope:** translate the owner's supplied visual reference into one shared Android/admin visual language and document first-release screens already required by the product and roadmap. The reference is style guidance only; it must not expand page, content, or behavior scope.

**Acceptance criteria:**

- [x] `docs/DESIGN_SYSTEM.md` defines the cross-platform coral/neutral palette, Lato typography, shared spacing/shapes/elevation, Android Material 3 rules, web dashboard patterns, responsive behavior, and accessibility requirements.
- [x] `docs/SCREEN_SPECIFICATIONS.md` describes all first-release Android and admin screens, navigation shells, primary content/actions, and relevant loading/empty/error/success behavior.
- [x] Screen specifications apply reference layout cues only where an existing screen has a matching role; other screens retain their product/roadmap content hierarchy and flow while using shared visual tokens.
- [x] Screen flows respect the product/database/API boundaries: authenticated cart, sample shipping and no tax, simulated payment without card data, seeded product images, and admin-only catalog/inventory/order capabilities.
- [x] Out-of-scope reference concepts are excluded; unresolved data/API conflicts (including category archive behavior) are explicitly recorded rather than invented.
- [x] Android/web agent guidance, product/roadmap references, and ADR index link to the shared design documents without duplicating the page inventory.

**Verification:** documentation review against `PRODUCT.md`, `DATABASE.md`, `API_CONTRACT.md`, `ARCHITECTURE.md`, and existing Android/admin Tasks; check internal links and `git diff --check`. No code or runtime test is applicable.

## Phase 1 — Accounts and Catalog

**Entry criteria:** Phase 0 exit criteria are met, including acceptance of DES-001 before implementing customer/admin screens. Implement the shared contract; update and review OpenAPI before changing endpoint behavior.

### AUTH-001 — Customer account API

**Status:** `[ ]`

**Depends on:** FND-002, FND-004, FND-005

**Scope:** customer registration, login/logout, profile, password reset, secure password storage, rate limiting/lockout controls, and revocable Android Sanctum tokens.

**Acceptance criteria:**

- [ ] Valid registration/login/profile/logout/reset flows match the reviewed OpenAPI schemas and security rules.
- [ ] Invalid input, duplicate email, invalid credentials, reset-token failure/expiry, rate limits, and logout revocation return documented outcomes without leaking secrets.
- [ ] Tests prove passwords are hashed, token lifetime/revocation rules and account lockout after repeated failures are enforced, and reset email can be safely exercised through a local mail sink.
- [ ] Tests cover relevant validation, authentication, and abuse boundaries; no real email or external provider is required for local tests.

**Verification:** backend unit and API feature/security tests for every listed success and failure path.

### AUTH-002 — Android customer authentication and profile

**Status:** `[ ]`

**Depends on:** FND-001, AUTH-001, DES-001

**Scope:** English registration, sign-in, sign-out, profile, password-reset screens, API integration, and protected token persistence.

**Acceptance criteria:**

- [ ] Forms show field validation, loading, server errors, network errors, and success states in English.
- [ ] Tokens use platform-protected storage, are never logged, and are cleared on logout or rejected/expired session.
- [ ] Repository/ViewModel behavior is testable without Android framework dependencies where practical; critical UI flow has a focused UI test.
- [ ] UI uses XML/Material 3 and supports accessibility labels and keyboard/input types.

**Verification:** Android unit tests for state and storage behavior, API-client tests for mapped responses, and a focused instrumentation/UI test for the critical auth path.

### AUTH-003 — Admin session authentication and API authorization

**Status:** `[ ]`

**Depends on:** FND-002, FND-003, FND-004, FND-005, DES-001

**Scope:** secure first-party admin sign-in/session lifecycle, Sanctum CSRF flow, and server-enforced admin role checks.

**Acceptance criteria:**

- [ ] Admin login/logout and session/CSRF behavior work with the documented local SPA/API origins and reviewed contract.
- [ ] Admin routes reject guests and customer accounts; tests verify role checks server-side, not only hidden UI controls.
- [ ] Session cookies use secure settings appropriate to local vs. HTTPS environments; no bearer token is stored in browser local storage for the admin SPA.
- [ ] Failure and expired-session UI states are visible and recoverable.

**Verification:** backend authentication/authorization feature tests and admin UI tests for login, logout, CSRF/session expiry, and rejected access.

### CAT-001 — Catalog read API and fictional seed data

**Status:** `[ ]`

**Depends on:** FND-002, FND-004, FND-005

**Scope:** category/product schema, fictional seed catalog, and public read/search/sort/pagination endpoints.

**Acceptance criteria:**

- [ ] Migrations enforce documented relationships, valid prices, product status, and image ordering; use fixed-precision USD money.
- [ ] Seed/reset creates useful fictional categories/products/images reproducibly and never contains real personal data.
- [ ] Listing, detail, category, search, sort, pagination, and empty-result behavior match OpenAPI.
- [ ] Invalid filters and pagination boundaries return documented errors; inactive/unavailable products do not leak into customer results.

**Verification:** migration/seed checks and API feature tests for results, filters, pagination, validation, and public access.

### CAT-002 — Android catalog browsing

**Status:** `[ ]`

**Depends on:** FND-001, FND-004, CAT-001, DES-001

**Scope:** home/category browsing, product list/detail, search/sort, and API-backed image display.

**Acceptance criteria:**

- [ ] Customer can browse seeded products, open details, search, sort, and navigate categories using the reviewed API contract.
- [ ] Loading, empty, image failure, offline/server error, and retry states are handled.
- [ ] USD amounts are formatted consistently without binary floating-point calculations; all user-facing copy is English.
- [ ] ViewModel/repository mapping has unit tests and the main browse-to-detail path has a focused UI test.

**Verification:** Android unit/API mapping tests and a focused UI smoke test with deterministic responses or seed data.

### CAT-003 — Admin catalog and inventory API

**Status:** `[ ]`

**Depends on:** FND-002, FND-004, AUTH-003, CAT-001

**Scope:** admin-only create/read/update/archive operations for products and categories, plus validated inventory updates.

**Acceptance criteria:**

- [ ] CRUD and inventory operations follow OpenAPI, validation, and database constraints.
- [ ] Guest/customer access is rejected; tests cover role enforcement, invalid values, missing resources, and inventory boundaries.
- [ ] Public catalog changes reflect persisted admin updates; deleted/archived data follows the documented status behavior.
- [ ] No client-supplied total or stock value bypasses server-side validation.

**Verification:** backend feature tests with database state assertions and authorization tests for each protected operation.

### CAT-004 — Admin catalog and inventory screens

**Status:** `[ ]`

**Depends on:** FND-003, FND-004, AUTH-003, CAT-003, DES-001

**Scope:** React admin screens for product, category, and stock management through the REST API.

**Acceptance criteria:**

- [ ] Admin can list, create, edit, archive, and validate product/category data and update stock through documented APIs.
- [ ] Loading, empty, validation, conflict, unauthorized/session-expired, and network-error states are understandable and recoverable.
- [ ] Forms are keyboard accessible, have labels, and behave at supported narrow and desktop widths.
- [ ] Tests cover critical form behavior and API error mapping without depending on backend internals.

**Verification:** admin component/behavior tests and production build/type checks.

**Phase 1 exit criteria:** a customer can register/sign in and browse/search seeded products; the admin can sign in and manage the catalog/inventory; server-side authorization, API/UI failure states, and the listed component tests pass.

## Phase 2 — Cart, Checkout, and Orders

**Entry criteria:** Phase 1 exit criteria are met. All money, stock, ownership, idempotency, and state transitions follow the reviewed contract.

### CART-001 — Customer cart API

**Status:** `[ ]`

**Depends on:** FND-002, FND-004, AUTH-001, CAT-001

**Scope:** one persistent cart per signed-in customer with add/update/remove/read operations.

**Acceptance criteria:**

- [ ] Server validates product availability, positive bounded quantity, and current product/stock state on every mutation.
- [ ] Cart totals use server-side fixed-precision money; clients cannot set authoritative prices.
- [ ] Customer ownership is enforced on every read and mutation; tests try another customer's cart identifiers.
- [ ] Empty cart, unavailable product, stock conflict, invalid quantity, and normal edits return the documented outcomes.

**Verification:** database-backed API tests for all mutations, totals, errors, and cross-customer authorization.

### CART-002 — Android cart experience

**Status:** `[ ]`

**Depends on:** FND-001, FND-004, AUTH-002, CAT-002, CART-001, DES-001

**Scope:** display and edit the signed-in customer's cart and recover from server conflicts.

**Acceptance criteria:**

- [ ] Customer can inspect items, update quantity, remove items, and see server-confirmed totals.
- [ ] Empty/loading/offline/error/stock-changed states are handled; retry does not silently duplicate a mutation.
- [ ] Cart state and money formatting are covered by unit tests; critical add/update/remove UI actions have focused UI coverage.

**Verification:** Android unit/API mapping tests and cart UI flow tests.

### ORD-001 — Order creation and simulated payment API

**Status:** `[ ]`

**Depends on:** FND-002, FND-004, AUTH-001, CAT-001, CART-001

**Scope:** server-authoritative checkout quote/order creation, address and line-item snapshots, idempotency, and explicitly simulated success/failure payment outcomes.

**Acceptance criteria:**

- [ ] Server recalculates prices, subtotal, configured sample shipping, and total using fixed precision; it ignores client totals.
- [ ] Order stores immutable product/address/price snapshots and follows documented state transitions.
- [ ] Order creation and payment/stock transitions are transaction-safe under concurrent or stale-stock requests; match `DATABASE.md` by changing inventory transactionally only when simulated payment succeeds.
- [ ] Repeating the same idempotency key/request does not create duplicate orders; conflicting reuse returns a documented result.
- [ ] Simulation accepts no card data, calls no real provider, and clearly distinguishes success from failure; failed payment is never shown as paid.
- [ ] Tests cover duplicate submission, stale stock, insufficient stock, transaction rollback, totals, ownership, and both payment outcomes.

**Verification:** database-backed API/transaction tests, idempotency tests, and security/ownership tests.

### CHECK-001 — Android checkout and simulated payment flow

**Status:** `[ ]`

**Depends on:** FND-001, FND-004, AUTH-002, CART-002, ORD-001, DES-001

**Scope:** signed-in address capture, order review, explicit demo outcome selection, and result display.

**Acceptance criteria:**

- [ ] Checkout validates required address fields, displays server-confirmed USD totals, and clearly labels the payment step as simulated.
- [ ] UI collects no card number, security code, or live payment credential.
- [ ] Success, failure, timeout, retry, and duplicate-submit states map correctly to server order state.
- [ ] Tests cover validation, state transitions, and safe retry/idempotency behavior.

**Verification:** Android unit/API mapping tests and a focused UI smoke test for success and failure outcomes.

### ORD-002 — Android order history and details

**Status:** `[ ]`

**Depends on:** FND-001, FND-004, AUTH-002, ORD-001, DES-001

**Scope:** customer-owned order list/detail and status display.

**Acceptance criteria:**

- [ ] Customer can view only their own orders and sees immutable item, address, USD total, payment result, and current status snapshots.
- [ ] Empty/loading/network/error states are handled with accessible English copy.
- [ ] Tests cover parsing, status display, and authorization/error handling.

**Verification:** backend ownership tests remain green; Android repository/ViewModel tests and order-history UI smoke test pass.

### ORD-003 — Admin order management

**Status:** `[ ]`

**Depends on:** FND-003, FND-004, AUTH-003, ORD-001, DES-001

**Scope:** admin order list/detail and permitted status updates.

**Acceptance criteria:**

- [ ] Admin can inspect order snapshots and apply only documented valid state transitions.
- [ ] Server rejects unauthorized users and invalid transitions; tests cover both.
- [ ] Dashboard shows loading, empty, conflict, error, and updated status states.
- [ ] Admin tests verify behavior through API responses, not implementation details.

**Verification:** backend transition/authorization feature tests and admin behavior tests.

**Phase 2 exit criteria:** a signed-in customer can complete the sample purchase flow through the API and database, including explicit simulated success/failure and safe duplicate submission; the customer can view the order and an admin can manage its status. Required ownership, stock, payment-state, and regression checks pass.

## Phase 3 — Quality and Portfolio Delivery

**Entry criteria:** Phase 2 customer purchase flow and admin order workflow are complete.

### QUAL-001 — Cross-component purchase-flow regression

**Status:** `[ ]`

**Depends on:** AUTH-002, CAT-002, CART-002, CHECK-001, ORD-002

**Scope:** a small number of deterministic end-to-end/smoke checks across Android, API, and database for the core customer journey.

**Acceptance criteria:**

- [ ] A clean seeded customer can browse, add/update cart items, complete simulated success, and view the resulting order.
- [ ] Simulated failure, duplicate submission, and at least one authorization boundary are covered by automated integration/regression checks at the most appropriate layer.
- [ ] Tests use isolated disposable data and cannot charge/contact a real provider.
- [ ] The suite runs locally and in CI with documented commands and actionable failure output.

**Verification:** run the smoke/regression suite from a clean database state and verify its CI job.

### QUAL-002 — Accessibility and UI quality pass

**Status:** `[ ]`

**Depends on:** DES-001, CAT-002, CAT-004, CART-002, CHECK-001, ORD-002, ORD-003

**Scope:** inspect and fix first-release accessibility, responsive behavior, consistency, and user-facing state gaps.

**Acceptance criteria:**

- [ ] Critical Android and admin flows have labels, focus/keyboard behavior, readable contrast/text, and usable narrow-screen layouts.
- [ ] Screens consistently handle loading, empty, error, success, and retry states without dead ends.
- [ ] Findings are recorded with a reproducible check or screenshot where useful; no unrelated redesign is introduced.

**Verification:** repeatable manual checklist plus focused automated accessibility/UI checks where supported by existing tooling.

### QUAL-003 — Security and privacy review

**Status:** `[ ]`

**Depends on:** AUTH-001, AUTH-003, CAT-003, CART-001, ORD-001, ORD-003

**Scope:** verify implemented first-release controls against [`SECURITY.md`](SECURITY.md) and the relevant OWASP API risks.

**Acceptance criteria:**

- [ ] Review object/function-level authorization, authentication, input validation, rate limiting, CSRF/CORS, secret handling, logging, and dependency advisories.
- [ ] Record each finding with severity, evidence, and resolution or an explicitly accepted non-production limitation; fix in-scope high-risk findings before release.
- [ ] Regression tests cover every fixed authorization/security defect; no secrets or real personal/payment data exist in repository history or demo seeds.
- [ ] The demo notice accurately states simulated payment and non-production limits.

**Verification:** security test matrix, dependency audit commands from `docs/DEVELOPMENT.md`, and reviewed findings record.

### QUAL-004 — Demo data and portfolio handoff guide

**Status:** `[ ]`

**Depends on:** FND-002, FND-003, CAT-001, AUTH-003, ORD-001

**Scope:** make local evaluation understandable and reproducible for a portfolio reviewer.

**Acceptance criteria:**

- [ ] Document clean setup, migrations/seeding, running all components, available demo roles, and reset procedure.
- [ ] Demo credentials are generated or local-only and clearly marked; no reusable public secrets or real user data are committed.
- [ ] Include concise architecture/flow explanation, screenshots or a short visual walkthrough, and known limitations.
- [ ] Explain that payment is simulated and no production readiness is claimed.

**Verification:** a person unfamiliar with the repository follows the guide from a clean checkout without undocumented steps.

### QUAL-005 — Clean-checkout release rehearsal

**Status:** `[ ]`

**Depends on:** FND-005, QUAL-001, QUAL-002, QUAL-003, QUAL-004

**Scope:** final local/CI rehearsal and closeout for the non-deployed portfolio release.

**Acceptance criteria:**

- [ ] From a clean checkout, install/setup instructions work and all documented required builds, static checks, tests, OpenAPI validation, and CI checks pass.
- [ ] No placeholder instructions, false CI claims, unreviewed API-contract changes, committed secrets, or unexplained known failures remain.
- [ ] Record tested commit, exact commands, results, limitations, and any follow-up task IDs.
- [ ] The phase exit criteria are reviewed; mark the roadmap tasks complete only with evidence.

**Verification:** independent reviewer repeats the documented clean-checkout procedure and checks the CI run and final task evidence.

**Phase 3 exit criteria:** an unfamiliar reviewer can set up and evaluate the complete local demo from a clean checkout; required CI/security/accessibility checks pass; demo limitations and any deferred follow-up work are clear.

## Optional follow-up — Public deployment

Public hosting is outside the required portfolio release. Do not block completion of Phases 0–3 on it. If requested, create a separately scoped deployment task after the local release is complete. Before execution, the owner must choose/approve the hosting provider, domain/origin arrangement, budget, secrets/configuration, and public demo-account policy. Deployment must use HTTPS, fictional data, and the simulated-payment boundary; production operations remain a separate project.

## Deferred product features

Wishlist, reviews, push notifications, coupons, analytics, guest checkout, multiple currencies/languages, real payment processing, taxes, carrier integrations, multi-vendor support, and production operations are not required for this release. Add any only through an explicitly accepted scope/ADR and a new Task ID in this backlog.
