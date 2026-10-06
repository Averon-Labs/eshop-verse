# API Contract

## Purpose

This document defines the conventions and standards for the REST API that serves as the integration boundary between all client applications (Android app, Admin dashboard) and the backend.

Both the Android application and the backend must treat this contract as their shared interface. Changes to the API contract require review and agreement from both frontend and backend developers.

---

## Base URL

**Status: OPEN**

The base URL structure will follow:

```
https://<domain>/api/v1/
```

Versioning is embedded in the URL path.

---

## Naming Conventions

- Use **lowercase** with **hyphens** for URL paths: `/api/v1/order-items`
- Use **plural nouns** for resource collections: `/products`, `/categories`
- Use **camelCase** for JSON field names: `firstName`, `createdAt`
- Use **consistent naming** across all endpoints

---

## Versioning Strategy

**Status: PROPOSED**

- API version is included in the URL path: `/api/v1/`, `/api/v2/`
- Breaking changes require a new API version.
- Non-breaking additions (new optional fields, new endpoints) do not require a version bump.
- Deprecated versions will be supported for a documented transition period.

---

## Request Conventions

### HTTP Methods

| Method | Usage |
|--------|-------|
| GET | Retrieve resources (never modifies state) |
| POST | Create new resources |
| PUT | Full replacement of a resource |
| PATCH | Partial update of a resource |
| DELETE | Remove a resource |

### Request Headers

```
Content-Type: application/json
Accept: application/json
Authorization: Bearer <token>    (for authenticated endpoints)
```

### Request Body

- Use JSON for all request bodies.
- Field names use camelCase.

---

## Response Conventions

### Successful Responses

**Single resource:**
```json
{
  "data": {
    "id": 1,
    "name": "Product Name"
  }
}
```

**Collection:**
```json
{
  "data": [
    { "id": 1, "name": "Product A" },
    { "id": 2, "name": "Product B" }
  ],
  "pagination": {
    "currentPage": 1,
    "perPage": 20,
    "totalItems": 100,
    "totalPages": 5
  }
}
```

**Action confirmation (no body needed):**
```
HTTP 204 No Content
```

---

## Error Response Conventions

**Status: PROPOSED**

All error responses follow a consistent format:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The request contains invalid fields.",
    "details": [
      {
        "field": "email",
        "message": "Email is required."
      }
    ]
  }
}
```

- `error.code` — Machine-readable error code.
- `error.message` — Human-readable description.
- `error.details` — Optional array of field-level errors.

---

## Authentication Conventions

**Status: OPEN**

Proposed approach:
- Token-based authentication (JWT or opaque tokens).
- Token sent via `Authorization: Bearer <token>` header.
- Specific authentication flow to be decided (see `docs/decisions/`).

---

## Pagination Conventions

**Status: PROPOSED**

- Use query parameters: `?page=1&perPage=20`
- Default page size: 20 items.
- Maximum page size: 100 items.
- Pagination metadata included in response body under `pagination` key.

---

## Status Code Conventions

| Code | Meaning |
|------|---------|
| 200 | Success — resource returned |
| 201 | Created — new resource created |
| 204 | No Content — action successful, no body |
| 400 | Bad Request — invalid input |
| 401 | Unauthorized — authentication required |
| 403 | Forbidden — insufficient permissions |
| 404 | Not Found — resource does not exist |
| 409 | Conflict — resource conflict (e.g., duplicate) |
| 422 | Unprocessable Entity — validation errors |
| 429 | Too Many Requests — rate limited |
| 500 | Internal Server Error — unexpected server failure |

---

## Open Decisions

- [ ] Authentication mechanism (JWT vs. opaque tokens)
- [ ] Rate limiting strategy
- [ ] File upload conventions (product images)
- [ ] Search/filter query parameter conventions
- [ ] Sorting conventions
- [ ] Bulk operation conventions
- [ ] Webhook conventions (if needed)
