# Architecture

## Overview

EShop Verse follows a client-server architecture with clearly separated components communicating through a RESTful API.

```
┌─────────────────┐     ┌─────────────────┐
│   Android App   │     │ Admin Dashboard  │
│   (Customer)    │     │     (Web)        │
└────────┬────────┘     └────────┬─────────┘
         │                       │
         └───────────┬───────────┘
                     │ HTTPS
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

---

## Components

### Android Customer Application

| Aspect | Decision | Status |
|--------|----------|--------|
| Language | Java | DECIDED |
| UI | XML layouts with Material 3 | DECIDED |
| Architecture | MVVM (Model-View-ViewModel) | DECIDED |
| Data Layer | Repository Pattern | DECIDED |
| Local Storage | Room (where appropriate) | DECIDED |
| Networking | REST API client | DECIDED |
| HTTP Client | OPEN — Retrofit recommended | PROPOSED |
| Image Loading | OPEN — Glide or Coil | OPEN QUESTION |
| Dependency Injection | OPEN — Hilt or manual | OPEN QUESTION |
| Navigation | OPEN — Jetpack Navigation or manual | OPEN QUESTION |
| Min SDK | OPEN — 24 recommended | PROPOSED |

### Backend API

| Aspect | Decision | Status |
|--------|----------|--------|
| Language | PHP | DECIDED |
| API Style | RESTful | DECIDED |
| Database | MySQL | DECIDED |
| Framework | OPEN — vanilla PHP, Laravel, or Slim | OPEN QUESTION |
| Authentication | OPEN — JWT or session-based | OPEN QUESTION |
| API Versioning | OPEN — URL prefix recommended | PROPOSED |

### Admin Dashboard

| Aspect | Decision | Status |
|--------|----------|--------|
| Type | Web application | DECIDED |
| Technology | OPEN — to be decided | OPEN QUESTION |
| Served by | OPEN — same backend or separate | OPEN QUESTION |

### Database

| Aspect | Decision | Status |
|--------|----------|--------|
| Engine | MySQL | DECIDED |
| Schema migrations | OPEN — manual SQL or framework-managed | OPEN QUESTION |
| Character set | OPEN — utf8mb4 recommended | PROPOSED |

---

## Component Boundaries

### Rules

1. The Android app communicates with the backend **only** through the REST API.
2. The Admin dashboard communicates with the backend **only** through the REST API (or a shared API with admin-specific endpoints).
3. No component directly accesses another component's database or internal state.
4. The API contract (documented in `API_CONTRACT.md`) is the integration boundary.
5. Components can be developed, tested, and deployed independently.

### Directory Mapping

```
android/    → Android customer application
backend/    → PHP REST API and database migrations
admin/      → Admin dashboard
docs/       → Shared documentation
```

---

## Cross-Cutting Concerns

| Concern | Approach | Status |
|---------|----------|--------|
| Authentication | Token-based (API) + local session (Android) | PROPOSED |
| Error Handling | Consistent error response format across API | PROPOSED |
| Logging | Server-side logging; client-side crash reporting | PROPOSED |
| Monitoring | OPEN | OPEN QUESTION |
| Caching | OPEN — client-side and/or server-side | OPEN QUESTION |
| File Storage | OPEN — local filesystem or cloud storage for product images | OPEN QUESTION |

---

## Key Architectural Decisions

Significant decisions are tracked as Architecture Decision Records in `docs/decisions/`.

See [DECISIONS.md](DECISIONS.md) for the index.
