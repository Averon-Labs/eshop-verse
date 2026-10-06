# Admin Dashboard — Agent Instructions

> Read the root `AGENTS.md` first. This file contains admin dashboard-specific rules.

---

## Architecture

| Aspect | Decision | Status |
|--------|----------|--------|
| Type | Web application | DECIDED |
| Technology | TBD | OPEN |
| Served by | TBD | OPEN |

> The admin dashboard technology stack has not been decided yet.
> Do not begin implementation until the technology decision is made (see `docs/decisions/`).

---

## Boundaries

- Admin code lives exclusively in `admin/`.
- Communication with the backend is through the REST API only.
- Admin functionality uses admin-specific API endpoints.
- Do not embed business logic that belongs in the backend.

---

## Planned Capabilities

- Product management (CRUD)
- Category management
- Order management
- User management
- Inventory management
- Basic analytics / reporting

---

## Testing

- Testing strategy will be defined once the technology stack is decided.
- See `docs/TESTING.md` for general conventions.
