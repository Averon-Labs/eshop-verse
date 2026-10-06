# Development Guide

## Repository Setup

### Prerequisites

- Git
- For Android development: Android Studio, JDK 17+
- For Backend development: PHP 8.x, MySQL 8.x, Composer
- For Admin development: TBD

### Clone and Setup

```bash
git clone https://github.com/Averon-Labs/eshop-verse.git
cd eshop-verse
```

### Component-Specific Setup

Each component has its own setup process. See:

- `android/` — Android application setup (TBD)
- `backend/` — Backend API setup (TBD)
- `admin/` — Admin dashboard setup (TBD)

---

## Branching

### Branch Types

| Prefix | Purpose |
|--------|---------|
| `feature/` | New features |
| `fix/` | Bug fixes |
| `refactor/` | Code restructuring |
| `chore/` | Tooling, config, maintenance |
| `docs/` | Documentation updates |

### Workflow

1. Start from an up-to-date `main`.
2. Create a descriptive branch: `feature/user-authentication`.
3. Make focused commits.
4. Push and open a Pull Request.
5. Pass CI checks and code review.
6. Merge to `main`.

---

## Commit Conventions

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat:     New feature
fix:      Bug fix
refactor: Code restructuring
test:     Tests
docs:     Documentation
chore:    Maintenance
build:    Build system
ci:       CI/CD
```

Examples:
```
feat: add product listing endpoint
fix: correct cart total calculation (#42)
test: add unit tests for OrderRepository
docs: update API contract with pagination
```

---

## Pull Requests

- Use the PR template at `.github/pull_request_template.md`.
- Reference the GitHub Issue being addressed.
- Describe what changed and why.
- Ensure all CI checks pass.
- Request review from at least one team member.
- Address all review comments before merging.

---

## Reviews

- All PRs require at least one human review.
- AI-generated code follows the same review process.
- Focus on correctness, conventions, security, and test coverage.

---

## Agent Workflow

AI coding agents working on this repository must:

1. Read `AGENTS.md` before starting.
2. Create a feature branch for their work.
3. Follow all project conventions.
4. Commit frequently with clear messages.
5. Create handoff files in `.ai/handoffs/` when unable to complete a task.
6. Never commit directly to `main`.
7. Never commit secrets or credentials.

See `AGENTS.md` for complete agent instructions.

---

## Testing

Before submitting a PR:

- Run relevant unit tests.
- Ensure no existing tests are broken.
- Add tests for new functionality.

See `docs/TESTING.md` for the testing strategy.

---

## Documentation

- Update relevant docs when changing behavior.
- Update `API_CONTRACT.md` when changing API endpoints.
- Add ADRs for significant architectural decisions.
- Keep the README consistent with the project state.

---

## Local Development

### Android

1. Open `android/` directory in Android Studio.
2. Sync Gradle.
3. Run on emulator or device.

> Detailed setup will be documented when the Android project is initialized.

### Backend

1. Install PHP dependencies with Composer.
2. Configure `.env` from `.env.example`.
3. Set up MySQL database.
4. Run migrations.
5. Start the development server.

> Detailed setup will be documented when the backend project is initialized.

### Admin Dashboard

> Setup will be documented when the admin project is initialized.
