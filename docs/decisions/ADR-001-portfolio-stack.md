# ADR-001: Portfolio Stack and First-Release Boundaries

## Status

ACCEPTED

## Date

2026-10-06

## Context

The project is an international, English-only portfolio application. Its Android implementation is intentionally Java/XML. The backend and admin stack, authentication, and demo checkout behavior needed explicit decisions before independent implementation work could begin.

## Options Considered

### Backend framework

- Laravel provides a conventional PHP application structure, migrations, validation, authorization, and first-party/mobile authentication support.
- Vanilla PHP or a minimal framework would leave more of these project-wide conventions to define and maintain.

### Admin client

- React with TypeScript exercises a separate client consuming the documented API.
- A server-rendered admin would reduce client setup but would not demonstrate the intended client/API boundary as clearly.

### Authentication

- Laravel Sanctum supports first-party SPA sessions and mobile API tokens.
- A custom JWT implementation would add token lifecycle and security work not needed by this first-party demo.

## Decision

- Keep the Android customer app in Java and XML with Material 3, MVVM, and repositories.
- Use Laravel with MySQL and framework-managed migrations for the REST API.
- Use React and TypeScript for the admin dashboard; it communicates with the backend only through the REST API.
- Use Laravel Sanctum session authentication for the first-party admin SPA and revocable bearer tokens for Android.
- Use `/api/v1/` as the API base path. Maintain a machine-readable OpenAPI description alongside the human-readable API conventions before implementing client/server endpoints.
- Scope the first release to a single-store, English-language demo with sample USD prices and simulated payment outcomes. It does not collect payment credentials or claim production readiness.

## Consequences

- The API contract must be agreed before backend and client work proceed independently.
- The admin SPA and API must be deployed under a compatible first-party domain arrangement for cookie-based Sanctum authentication.
- Real payment processing, taxes, shipping-carrier integration, production hosting, and multi-currency support require separate decisions.
- Framework and dependency versions must be selected from supported stable releases when implementation begins; this ADR does not pin versions.
