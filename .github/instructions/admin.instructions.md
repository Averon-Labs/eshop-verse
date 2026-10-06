# Admin Dashboard Development Instructions

For GitHub Copilot and other IDE-integrated agents working on admin dashboard code.

## References

- Primary instructions: `/AGENTS.md`
- Admin-specific: `/admin/AGENTS.md`
- Architecture: `/docs/ARCHITECTURE.md`
- API Contract: `/docs/API_CONTRACT.md`
- Security: `/docs/SECURITY.md`
- Testing: `/docs/TESTING.md`

## Key Rules

- Technology: React and TypeScript (see `/admin/AGENTS.md`)
- Communication with backend: REST API only
- Do not embed business logic in the admin dashboard
- Admin endpoints require admin role authorization
- Use Laravel Sanctum's first-party SPA session flow and CSRF protection.
