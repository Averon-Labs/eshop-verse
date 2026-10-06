# Backend API — Agent Instructions

> Read the root `AGENTS.md` first. This file contains backend-specific rules.

---

## Architecture

| Aspect | Decision | Status |
|--------|----------|--------|
| Language | PHP | DECIDED |
| API Style | RESTful | DECIDED |
| Database | MySQL | DECIDED |
| Framework | TBD | OPEN |
| Authentication | TBD | OPEN |
| Migration Tool | TBD | OPEN |

---

## Project Structure (Planned)

```
backend/
├── public/              # Web server document root
│   └── index.php        # Entry point
├── src/                 # Application source code
│   ├── Controllers/     # Request handlers
│   ├── Models/          # Data models
│   ├── Services/        # Business logic
│   ├── Middleware/       # Request middleware
│   └── Config/          # Configuration
├── database/
│   ├── migrations/      # Database migrations
│   └── seeds/           # Seed data
├── tests/
│   ├── unit/
│   ├── integration/
│   └── api/
├── composer.json
├── .env.example
└── AGENTS.md            # This file
```

> This structure is illustrative. The actual structure depends on the framework decision.

---

## Conventions

### API

- Follow the API contract in `docs/API_CONTRACT.md`.
- Use JSON for all request and response bodies.
- Return appropriate HTTP status codes.
- Include consistent error responses.
- Validate all input server-side.

### Code Style

- Follow PSR-12 coding standards.
- Use type declarations for parameters and return types.
- Use meaningful names for classes, methods, and variables.
- Document public methods with PHPDoc.

### Security

- Use parameterized queries — never concatenate SQL.
- Hash passwords with bcrypt or Argon2.
- Validate and sanitize all user input.
- Never expose internal errors to clients.
- See `docs/SECURITY.md` for complete guidelines.

---

## Boundaries

- Backend code lives exclusively in `backend/`.
- The API is the only interface for client applications.
- Do not serve frontend assets from the API (separate concerns).
- Database access is only through the backend.

---

## Testing

- Unit tests in `tests/unit/`
- Integration tests in `tests/integration/`
- API tests in `tests/api/`
- See `docs/TESTING.md` for conventions.
