# Project Roadmap

## Goal

Deliver a polished, end-to-end single-store portfolio demo for an international audience. The product scope and deferred features are defined in [`PRODUCT.md`](PRODUCT.md). Each phase is complete only when its acceptance criteria are met, required tests pass, and the documentation and demo data are current.

## Phases

### Phase 0 — Foundation (current)

- Confirm the first-release scope and stack in `PRODUCT.md` and ADR-001.
- Initialize each component and document repeatable setup/build/test commands.
- Define the OpenAPI contract before independently implementing API clients and endpoints.
- Configure CI to build and run required checks; require passing checks and review before merging.

**Exit criteria:** a new contributor can set up each initialized component; the API contract is reviewed; CI reports required checks; no unresolved decision blocks the first vertical slice.

### Phase 1 — Accounts and Catalog

- Customer registration, sign-in, and profile basics.
- Password reset using a development mail sink for local/demo verification.
- Product/category seed data, listing, search/sort, and product details in Android.
- Admin sign-in and product/category/inventory management.

**Exit criteria:** a signed-in customer can browse seeded products; unauthorized users cannot change catalog data; API and UI failure/loading/empty states are handled.

### Phase 2 — Cart, Checkout, and Orders

- Cart read/update and server-side price/stock validation.
- Address capture and immutable order address snapshot.
- Deterministic simulated payment success/failure; no real payment credentials or provider.
- Customer order history/detail and admin order status updates.

**Exit criteria:** the complete sample purchase flow works from app to API to database and back; duplicate submission is safe; failed payment does not silently create a paid order; regression and authorization tests pass.

### Phase 3 — Portfolio Hardening

- Accessibility, responsive admin layout, usability, and error-state review.
- Security review against the API risks relevant to this app.
- Seed/reset instructions, demo accounts, screenshots, and a clear non-production notice.
- Verify build and checks on a clean environment; document deployment only if a public demo is approved.

**Exit criteria:** another person can follow the setup/demo guide; required CI checks pass; demo credentials and sample data are safe to publish; known limitations are documented.

### Deferred Features

Wishlist, reviews, push notifications, coupons, analytics, guest checkout, multiple currencies/languages, real payments, tax/shipping integrations, and multi-vendor support are not required to complete this portfolio release. Add them only through a scoped task with acceptance criteria.

---

Detailed work is tracked in GitHub Issues. Use `.ai/tasks/` only for complex tasks needing persistent implementation context.
