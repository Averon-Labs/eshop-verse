# Security Guidelines

## Purpose

This document establishes security practices for the EShop Verse platform. All contributors (human and AI) must follow these guidelines.

> **Note:** This document defines security requirements and practices.
> Security features have not been implemented yet.

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

**Status: OPEN — Specific mechanism to be decided**

### Requirements

- Passwords must be hashed using a strong algorithm (bcrypt, Argon2).
- Never store plain text passwords.
- Implement account lockout after repeated failed attempts.
- Support secure session management.
- Token-based authentication for the API.
- Tokens must have reasonable expiration times.
- Implement secure password reset flow.

---

## Authorization

### Requirements

- Enforce role-based access control (RBAC): customer vs. admin.
- Validate permissions on every API request (server-side).
- Never rely on client-side authorization checks alone.
- Admin endpoints must require admin role.
- Users must only access their own data (orders, cart, profile).

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
