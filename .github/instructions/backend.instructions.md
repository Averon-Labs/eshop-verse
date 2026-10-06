# Backend Development Instructions

For GitHub Copilot and other IDE-integrated agents working on backend code.

## References

- Primary instructions: `/AGENTS.md`
- Backend-specific: `/backend/AGENTS.md`
- Architecture: `/docs/ARCHITECTURE.md`
- API Contract: `/docs/API_CONTRACT.md`
- Database: `/docs/DATABASE.md`
- Security: `/docs/SECURITY.md`
- Testing: `/docs/TESTING.md`

## Key Rules

- Language: PHP
- Framework: Laravel (see `/backend/AGENTS.md`)
- API Style: RESTful
- Database: MySQL
- Authentication: Laravel Sanctum
- Follow PSR-12 coding standards
- Use parameterized queries — never concatenate SQL
- Validate all input server-side
- Follow API contract conventions
- Use Laravel migrations and PHPUnit tests with isolated data
