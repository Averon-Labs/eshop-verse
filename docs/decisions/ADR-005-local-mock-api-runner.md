# ADR-005: Local Mock API Server Runner

## Status

ACCEPTED

## Date

2026-10-10

## Context

Android development in Phases 1 and 2 requires consuming backend REST API endpoints that are being built concurrently or whose real implementation depends on backend roadmap tasks. To prevent blocking Android feature delivery and UI verification, a local mock server is required to simulate contract-compliant endpoints based on `docs/openapi.yaml` and shared fixtures.

A decision was required on the runner technology for the local mock server (Decision OPEN-5).

## Options Considered

### Option A: Python 3 Standard Library (`server.py`)

- **Pros:**
  - Zero external dependencies; uses only `http.server`, `urllib`, `json`.
  - Available on developer workstations without additional package installation (`pip`, `npm`).
  - Fast startup, minimal memory consumption.
  - Keeps Android tools self-contained under `android/tools/mock-api/`.
- **Cons:**
  - Requires Python 3 to be installed on developer host machine.

### Option B: Node.js Express / Fastify Server

- **Pros:**
  - Familiar to frontend/web developers.
- **Cons:**
  - Requires `node_modules` and npm dependency maintenance inside the Android component or shared root.
  - Adds dependency overhead before Admin dashboard toolchain is fully standardized.

## Decision

Choose **Option A: Python 3 Standard Library runner** (`android/tools/mock-api/server.py`).

The mock server binds to `127.0.0.1:8081` (reachable from Android Emulator as `10.0.2.2:8081`), reads shared fixtures from `android/app/src/test/resources/fixtures/api`, provides in-memory state with reset capabilities (`POST /__mock/reset`), and enforces `Idempotency-Key` headers for order and payment operations.

## Consequences

- Android developers can execute `python android/tools/mock-api/server.py` to run offline emulator testing with no setup.
- The unit test suite continues to use OkHttp `MockWebServer` with the exact same shared fixture JSON files.
- Zero extra dependencies are added to the repository.
