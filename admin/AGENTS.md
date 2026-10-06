# Admin Dashboard — Agent Instructions

> Read the root `AGENTS.md` first. This file contains admin dashboard-specific rules.

---

## Architecture

| Aspect | Decision | Status |
|--------|----------|--------|
| Type | Web application | DECIDED |
| Technology | React and TypeScript | DECIDED |
| API access | REST API only | DECIDED |
| Authentication | Laravel Sanctum first-party SPA session | DECIDED |

Use a supported stable toolchain selected at project initialization. The SPA and API must use a compatible first-party domain arrangement for secure cookie/CSRF behavior.

---

## Boundaries

- Admin code lives exclusively in `admin/`.
- Communication with the backend is through the REST API only.
- Admin functionality uses admin-specific API endpoints.
- Do not embed business logic that belongs in the backend.

---

## First-Release Capabilities

- Product management (CRUD)
- Category management
- Order management
- Inventory management

Customer administration and analytics are deferred; see `docs/PRODUCT.md`.

---

## Testing

- Use Vitest and React Testing Library for component/behavior tests unless the initialized project has a documented equivalent.
- See `docs/TESTING.md` for shared test levels and the sequential verification workflow.
