# Testing Strategy

## Purpose

This document defines the testing strategy and conventions for the EShop Verse platform.

> **Note:** Testing infrastructure has not been set up yet.
> This document establishes the planned approach.

---

## Testing Levels

### Unit Testing

**Android:**
- Test ViewModels, Repositories, and utility classes.
- Use JUnit 5 for test execution.
- Use Mockito for mocking dependencies.
- Unit tests run without Android framework dependencies.

**Backend (PHP):**
- Test service classes, validators, and data transformations.
- Testing framework to be decided (PHPUnit recommended).
- Mock database and external service interactions.

### Integration Testing

**Android:**
- Test Room database operations.
- Test API client with mock server responses.
- Use AndroidX Test libraries.

**Backend (PHP):**
- Test API endpoints with a test database.
- Verify database queries and transactions.
- Test authentication and authorization flows.

### API Testing

- Test all API endpoints against the contract in `API_CONTRACT.md`.
- Verify request validation and error responses.
- Test authentication and authorization.
- Test pagination and filtering.
- Can be automated with tools like Postman/Newman or REST Assured.

### UI Testing

**Android:**
- Test critical user flows (login, browse, add to cart, checkout).
- Use Espresso for UI testing.
- Focus on happy paths and critical error paths.

### Regression Testing

- All existing tests must pass before merging.
- CI pipeline runs the full test suite on every PR.
- No tests should be disabled without documented justification.

---

## Test Naming Conventions

### Android (Java)

```java
@Test
void methodName_scenario_expectedBehavior() { }

// Examples:
@Test
void getProducts_emptyCategory_returnsEmptyList() { }

@Test
void addToCart_invalidQuantity_throwsException() { }
```

### Backend (PHP)

```php
public function test_methodName_scenario_expectedBehavior(): void { }

// Examples:
public function test_createUser_duplicateEmail_returns409(): void { }

public function test_getProducts_withPagination_returnsPagedResults(): void { }
```

---

## Test Organization

### Android

```
android/app/src/test/          # Unit tests
android/app/src/androidTest/   # Instrumented tests
```

### Backend

```
backend/tests/
├── unit/
├── integration/
└── api/
```

---

## Definition of Done (Testing)

- [ ] New code has unit tests covering core logic.
- [ ] Edge cases and error paths are tested.
- [ ] All existing tests pass.
- [ ] No tests are skipped or disabled without documented reason.
- [ ] Test names follow the naming convention.
- [ ] Tests are deterministic (no flaky tests).
- [ ] Integration tests use isolated test data.
