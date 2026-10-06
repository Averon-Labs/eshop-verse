# EShop Verse

A production-oriented e-commerce platform featuring an Android customer application, RESTful backend, and admin dashboard.

---

## Overview

EShop Verse is a multi-component e-commerce platform designed for real-world usage. It provides customers with a mobile shopping experience, merchants with an administration dashboard, and connects both through a RESTful API.

## Features

### Customer Application (Android)
- Product browsing and search
- Product details and reviews
- Shopping cart and wishlist
- User authentication and profiles
- Order placement and tracking
- Push notifications

### Admin Dashboard
- Product and inventory management
- Order management and fulfillment
- User management
- Analytics and reporting

### Backend API
- RESTful API serving both client applications
- User authentication and authorization
- Product catalog management
- Order processing
- Payment integration
- Notification services

---

## Architecture

```
┌─────────────────┐     ┌─────────────────┐
│   Android App   │     │ Admin Dashboard  │
│   (Customer)    │     │     (Web)        │
└────────┬────────┘     └────────┬─────────┘
         │                       │
         └───────────┬───────────┘
                     │
              ┌──────▼──────┐
              │  REST API   │
              │   (PHP)     │
              └──────┬──────┘
                     │
              ┌──────▼──────┐
              │   MySQL     │
              │  Database   │
              └─────────────┘
```

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for detailed architecture documentation.

---

## Technology Stack

| Component | Technologies |
|-----------|-------------|
| Android App | Java, XML, Material 3, MVVM, Repository Pattern, Room, Retrofit |
| Backend | PHP, RESTful API |
| Admin Dashboard | TBD |
| Database | MySQL |
| CI/CD | GitHub Actions |

---

## Repository Structure

```
├── android/           # Android customer application
├── backend/           # PHP REST API
├── admin/             # Admin dashboard
├── docs/              # Project documentation
│   ├── decisions/     # Architecture Decision Records
│   └── *.md           # Topic-specific documentation
├── .ai/               # AI agent workspace
├── .github/           # GitHub configuration
│   ├── ISSUE_TEMPLATE/
│   ├── workflows/
│   └── instructions/
├── AGENTS.md          # AI agent instructions (provider-neutral)
├── CLAUDE.md          # Claude Code adapter
├── CONTRIBUTING.md    # Contribution guidelines
└── LICENSE            # MIT License
```

---

## Development Workflow

This project uses a branch-based workflow:

1. Create a feature branch from `main`.
2. Implement changes with focused commits.
3. Open a Pull Request.
4. Pass CI checks and code review.
5. Merge to `main`.

See [CONTRIBUTING.md](CONTRIBUTING.md) and [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) for full details.

---

## AI-Assisted Development

This repository is designed for collaborative development between human developers and AI coding agents. The multi-agent workflow is documented in:

- [AGENTS.md](AGENTS.md) — Provider-neutral agent instructions
- [.ai/README.md](.ai/README.md) — AI workspace documentation

Supported agents include Claude Code, OpenAI Codex, Google Gemini/Antigravity, GitHub Copilot, and other compatible tools.

---

## Documentation

| Document | Description |
|----------|-------------|
| [PRODUCT.md](docs/PRODUCT.md) | Product requirements and vision |
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | System architecture |
| [API_CONTRACT.md](docs/API_CONTRACT.md) | API conventions and contracts |
| [DATABASE.md](docs/DATABASE.md) | Database design |
| [DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md) | UI/UX design system |
| [SECURITY.md](docs/SECURITY.md) | Security guidelines |
| [TESTING.md](docs/TESTING.md) | Testing strategy |
| [DEVELOPMENT.md](docs/DEVELOPMENT.md) | Development workflow |
| [DECISIONS.md](docs/DECISIONS.md) | Architecture decisions index |
| [ROADMAP.md](docs/ROADMAP.md) | Project roadmap |

---

## Project Status

**Phase 0 — Foundation**

The repository structure and engineering workflow are being established. Application development has not yet begun.

See [docs/ROADMAP.md](docs/ROADMAP.md) for the full project roadmap.

---

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

Copyright (c) 2026 Averon Labs
