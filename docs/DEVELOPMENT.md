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

## Conventions

All branching, commit, PR, testing, and agent workflow conventions are defined in [`AGENTS.md`](../AGENTS.md). Do not duplicate them here.

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
