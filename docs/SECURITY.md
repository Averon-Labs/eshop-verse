# Security Guidelines

## Purpose

This document establishes security practices for the EShop Verse platform. All contributors (human and AI) must follow these guidelines.

> **Note:** These are requirements, not evidence that controls are already implemented. Verify each control against the code before release.

---

## Secrets Management

### Rules

- **Never commit secrets** to the repository (API keys, passwords, tokens, private keys).
- **Never commit `.env` files** containing real credentials.
- Use `.env.example` files with placeholder values to document required variables.
- Store secrets in environment variables or a secure vault.
- Add sensitive file patterns to `.gitignore`.

### Gitignore Patterns

```
.env
.env.local
.env.*.local
*.key
*.pem
*.p12
google-services.json   # if contains real config
```

---

## Authentication

**Status: DECIDED — Laravel Sanctum**

### Requirements

- Passwords must be hashed using a strong algorithm (bcrypt, Argon2).
- Never store plain text passwords.
- Implement account lockout after repeated failed attempts.
- Use Laravel's session protections for the first-party admin SPA and revocable Sanctum bearer tokens for Android.
- Keep Android tokens in platform-protected storage; never put them in source control, logs, or ordinary preferences.
- Configure a 30-day maximum token lifetime and revoke the current token on logout; verify the behavior in tests.
- Implement secure password reset flow.
- Require an authenticated customer account for checkout in the demo.

---

## Authorization

### Requirements

- Enforce role-based access control (RBAC): customer vs. admin.
- Validate permissions on every API request (server-side).
- Never rely on client-side authorization checks alone.
- Admin endpoints must require admin role.
- Users must only access their own data (orders, cart, profile).
- Test object-level authorization using another customer's identifiers; every query/mutation must enforce ownership on the server.

---

## Input Validation

### Backend (PHP)

- Validate all input on the server side.
- Never trust client-side validation alone.
- Sanitize input to prevent XSS.
- Use parameterized queries or prepared statements — **never concatenate SQL**.
- Validate data types, lengths, and formats.
- Reject unexpected fields.

### Android Client

- Validate user input before sending to API.
- Sanitize displayed content to prevent injection.
- Use appropriate input types and constraints.

---

## API Security

### Requirements

- Use HTTPS for all API communication.
- Validate `Content-Type` headers.
- Implement rate limiting.
- Return minimal error information to clients (no stack traces, no internal paths).
- Use CORS configuration for the admin dashboard.
- Protect the first-party admin session flow with secure cookies and CSRF protections; configure the SPA/API domains deliberately.
- Validate and sanitize all query parameters.

### Recommended Headers

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

---

## Sensitive Data

- Never log passwords, tokens, or PII in plain text.
- Mask sensitive data in logs (show last 4 digits of phone, etc.).
- Encrypt sensitive data at rest where required.
- Follow data minimization — collect only what is needed.
- Implement secure data deletion for account removal.

---

## Dependency Security

- Review dependencies before adding them.
- Pin dependency versions.
- Check for known vulnerabilities regularly.
- Keep dependencies updated.
- Prefer well-maintained, widely-used libraries.
- Remove unused dependencies.

---

## Logging

### Requirements

- Log authentication events (login, logout, failed attempts).
- Log authorization failures.
- Log API errors and exceptions.
- **Never log sensitive data** (passwords, tokens, full credit card numbers).
- Include request context (user ID, IP, timestamp) in logs.
- Implement log rotation.

---

## Database Security

- Use least-privilege database accounts.
- The application database user should not have GRANT or DDL privileges in production.
- Use parameterized queries exclusively.
- Encrypt database connections (TLS).
- Regular database backups.
- Separate database credentials per environment.

## Portfolio Demo Boundaries

- Use fictional seed users, products, addresses, and orders. Never publish real customer or merchant data.
- Payment is simulated. Do not request, accept, log, or store card numbers, security codes, or live payment tokens.
- Do not describe the portfolio demo as production-ready. A real launch requires a separate threat model, privacy/legal review for its target market, payment-provider review, deployment controls, monitoring, backup/recovery, and incident response.
- Use the [OWASP API Security Top 10](https://owasp.org/API-Security/) as a risk checklist, especially broken object/function authorization, authentication, and unrestricted resource consumption. It complements application-specific review; it is not a substitute for one.
