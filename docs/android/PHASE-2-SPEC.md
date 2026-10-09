# Android Phase 2 — Cart, Checkout, and Orders Implementation Spec

Companion to the canonical Phase 2 steps in [`../ANDROID_ROADMAP.md`](../ANDROID_ROADMAP.md).

Read the Phase 2 section for the task you own. Do not read other phase specs.

---

## A. Entry conditions

- Phase 1 tasks are complete and green.
- `docs/openapi.yaml` is reviewed and accepted.
- Phase 0 shell (`nav_main.xml` graph ids and arguments), design tokens, network core, money utilities,
  and `TokenStore` are frozen.
- The mock server or real backend answers at `BuildConfig.API_BASE_URL`, and
  `POST /__mock/reset` restores a seeded cart, catalog, and stock state.

## B. Wave plan

| Wave | Tasks (parallel) | Why parallel is safe |
|------|------------------|----------------------|
| 1 | `CART-002`, `CHECK-001`, `ORD-002` | Disjoint packages, disjoint nested graphs, disjoint `strings_<feature>.xml`. Cross-feature navigation targets frozen graph ids and arguments only. |

The mock strategy is what makes this wave parallel: `CHECK-001` and `ORD-002` are verified against
fixtures rather than against orders produced by another task.

Interface frozen by APP-002 that these three tasks rely on:

| From | To | Argument |
|------|----|----------|
| Any task | `nav_cart` | none |
| Any task | `nav_checkout` | `shippingAddressId` (string, optional) |
| Any task | `nav_orders` | `orderId` (int, optional) |
| Any task | `nav_catalog` | none |
| Any task | `nav_auth` | `returnToNavId` (reference) |

A task that needs a change to these ids or arguments escalates to the coordinator; it does not edit
`nav_main.xml` or another feature's graph.

## C. Shared rules for Phase 2

- **Money is server-authoritative.** No screen computes a subtotal, shipping amount, or total. Screens
  render the amounts returned by `GET /cart`, `POST /checkout/quote`, and the order resource.
- **No optimistic money.** Quantity and removal changes show an in-flight state and render the cart the
  server returns. A client-side "looks fine" total must never appear.
- **No automatic retry of a mutation.** A failed mutation surfaces a retry action; retry is a new user
  action with a new idempotency key.
- **No payment credentials.** No card number, expiry, CVC, or provider logo or field anywhere.
  The payment step is labelled as simulated in the UI copy.
- **A timeout is never success.** Every success path renders the server-returned state.
- **Empty, loading, error, and retry states** come from `StateContainerView`; no per-screen variants.

---

## D. CART-002 — Cart experience

Screen: **M-10** cart.

### D.1 Operations consumed

| Operation | Used by |
|-----------|---------|
| `GET /cart` | M-10 initial load, badge seed |
| `POST /cart/items` | Quantity increase for a line that exists (add-to-cart entry point from CAT-002) |
| `PATCH /cart/items/{productId}` | Quantity stepper, clamped to the returned `availableQuantity` |
| `DELETE /cart/items/{productId}` | Remove line |
| `DELETE /cart/items` | Clear cart (only if the screen exposes it; not required by the specification) |

### D.2 Files owned

```
cart/CartRepository.java
cart/CartViewModel.java
cart/CartFragment.java
cart/CartAdapter.java
res/layout/fragment_cart.xml
res/layout/item_cart_line.xml
res/navigation/nav_cart.xml
res/values/strings_cart.xml
res/drawable/ic_remove_item.xml
test: cart/CartRepositoryTest.java, cart/CartViewModelTest.java, cart/CartTotalsTest.java
androidTest: cart/CartFlowTest.java
```

Must not touch: shell files, shared tokens, `core/**`, or another feature's package.

Cart badge: CART-002 supplies `itemCount` from the cart response to the shell badge API defined by
APP-002. The badge never counts local state.

### D.3 Behaviour rules

| Situation | Required behaviour |
|-----------|--------------------|
| Quantity change | Disable the stepper for that line while the request is in flight; render the cart from the response. Do not increment locally. |
| Line reports `priceChanged` | Show the current price and a one-line notice that the price changed; keep the line selected. |
| Line reports `unavailable` | Show the line as unavailable, disable quantity changes, and offer removal. |
| `409 INSUFFICIENT_STOCK` | Update the line's availability from `error.details`, keep the previous quantity, and explain the limit. Never silently clamp. |
| `404 CART_ITEM_NOT_FOUND` | The line is gone server-side; re-read the cart and drop the stale row. |
| `401` | Clear session, route to auth with the cart as the return destination. Do not discard the intent to view the cart. |
| Empty cart | Empty state with one action to Explore; checkout stays disabled. |
| Offline / 5xx | Retryable error state; no mutation is repeated automatically. |
| Result reveals `hasIssues` | Show one summary line at the top of the cart explaining that a line needs attention before checkout. |

### D.4 Totals presentation

- Render `subtotal`, `shipping`, and `total` exactly as returned; label shipping as the configured
  sample rate.
- Do not show tax, discounts, free-shipping thresholds, or estimated delivery.
- **Continue to checkout** is enabled only when the cart is non-empty and no line is `unavailable`.

### D.5 Tests

| Level | Test | Proves |
|-------|------|--------|
| JVM | `CartTotalsTest` | The UI layer never sums money itself; the values it renders equal the server strings |
| JVM | `CartRepositoryTest` (MockWebServer + fixtures) | Parsing of every cart state; mapping of `409 INSUFFICIENT_STOCK`, `404 CART_ITEM_NOT_FOUND`, `401`; no retry of a mutation |
| JVM | `CartViewModelTest` | In-flight lock prevents a double mutation; state after each failure; stale-line recovery |
| Instrumentation | `CartFlowTest` | Load → change quantity → remove line → empty state; the total always matches the last server response |

Criteria mapping: **a** = D.1/D.3/D.4; **b** = D.3 states plus the no-retry rule; **c** = D.5.

### D.6 Evidence

Test output, plus screenshots of the populated cart, the insufficient-stock state, and the empty cart.

---

## E. CHECK-001 — Checkout and simulated payment

Screens: **M-11** shipping address, **M-12** order review, **M-13** simulated payment choice,
**M-14** payment/order result.

### E.1 Operations consumed

| Operation | Used by |
|-----------|---------|
| `POST /checkout/quote` | M-12 (server-confirmed totals and address validation) |
| `POST /orders` (with `Idempotency-Key`) | M-13 → order creation |
| `POST /orders/{orderId}/payment` (with `Idempotency-Key`) | M-13 outcome submission |
| `GET /orders/{orderId}` | M-14 recovery after a timeout or ambiguous result |

### E.2 Files owned

```
checkout/CheckoutRepository.java
checkout/CheckoutViewModel.java
checkout/ShippingAddressFragment.java
checkout/OrderReviewFragment.java
checkout/PaymentChoiceFragment.java
checkout/OrderResultFragment.java
checkout/AddressValidator.java
checkout/IdempotencyKeyFactory.java
res/layout/fragment_shipping_address.xml
res/layout/fragment_order_review.xml
res/layout/fragment_payment_choice.xml
res/layout/fragment_order_result.xml
res/layout/item_review_line.xml
res/navigation/nav_checkout.xml
res/values/strings_checkout.xml
res/drawable/ic_simulated_payment.xml
test: checkout/AddressValidatorTest.java, checkout/CheckoutRepositoryTest.java,
      checkout/CheckoutViewModelTest.java, checkout/IdempotencyRuleTest.java
androidTest: checkout/CheckoutSuccessTest.java, checkout/CheckoutFailureTest.java
```

Must not touch: shell files, shared tokens, `core/**`, or another feature's package.

### E.3 Address form

Fields match the contract exactly: `recipientName`, `line1`, `line2` (optional), `city`, `region`,
`postalCode`, `country`. Validation mirrors the contract lengths and the `^[A-Z]{2}$` country rule;
uppercase the country input. Show a short explanation that the address is snapshotted onto this order
and that saved addresses are not part of the first release. **Continue** validates before proceeding.

No address is stored locally as a saved address.

### E.4 Idempotency rules

This is the reason duplicate submission cannot create two orders. It applies to both `POST /orders` and
`POST /orders/{orderId}/payment`.

| Rule | Detail |
|------|--------|
| Key lifetime | One key per **logical attempt**. Created when the customer taps the action. |
| Same attempt, same key | A transport-level retry after a timeout or connection failure reuses the same key and therefore replays the server's stored result. |
| User-visible retry | A new attempt (the customer taps again after being shown an error) uses a **new** key, because it is a new intent. |
| In-flight lock | Both actions are disabled while a request is in flight; the button shows a progress state. |
| Ambiguous result | On timeout, M-14 does not claim success or failure. It re-reads `GET /orders/{orderId}` if an id is known, otherwise offers a safe retry. |
| Key storage | The key lives in the ViewModel for the attempt only; it is never persisted and never logged beyond an opaque identifier. |

Record the rule in a test: `IdempotencyRuleTest` asserts one key per attempt and that a new attempt
produces a different key.

### E.5 Payment step

- M-13 states plainly that the outcome is a demo selector and that no card data is requested.
- Two explicit actions: **Simulate success** and **Simulate failure**. No provider branding.
- On success the server returns `confirmed` and `completed`; the app renders **only** the returned
  state.
- On failure the order stays `pending_payment` (contract `x-order-state-machine`), so M-14 offers a
  safe retry path and shows the failed payment status. Do not present a failed payment as paid and do
  not show a terminal state the server did not return.
- `409 INVALID_ORDER_STATE` (for example a retry after the order was already confirmed) is resolved by
  re-reading the order and rendering its actual state.

### E.6 Error mapping

| HTTP | `error.code` | Behaviour |
|------|--------------|-----------|
| 409 | `CART_EMPTY` | Return to the cart with a clear explanation |
| 409 | `INSUFFICIENT_STOCK` | Return to the cart, refresh it, and highlight the affected line |
| 409 | `PRODUCT_UNAVAILABLE` | Return to the cart, refresh it, mark the line unavailable |
| 409 | `IDEMPOTENCY_KEY_REUSED` | A genuine client bug: do not silently retry; surface a safe error and start a new attempt |
| 409 | `INVALID_ORDER_STATE` | Re-read the order and render its real state |
| 400 | `MISSING_IDEMPOTENCY_KEY` | Client bug; block submission and report it, never retry blindly |
| 422 | `VALIDATION_ERROR` | Field errors on the address form |
| 401 | `UNAUTHENTICATED` | Clear session and route to auth, preserving the checkout intent for a signed-in return |
| 429 | `RATE_LIMITED` | Honour `Retry-After` before offering retry |
| 500 / timeout | — | Retryable, without claiming an outcome |

### E.7 Tests

| Level | Test | Proves |
|-------|------|--------|
| JVM | `AddressValidatorTest` | Required fields, lengths, country format, optional line 2 |
| JVM | `CheckoutRepositoryTest` (MockWebServer + fixtures) | Quote parsing; order creation; both payment outcomes; every error mapping in E.6 |
| JVM | `CheckoutViewModelTest` | Review → payment → result transitions; in-flight lock; no duplicate order on double tap; timeout leaves the state unresolved and then recovers |
| JVM | `IdempotencyRuleTest` | One key per attempt; a new attempt gets a new key; a transport retry reuses the key |
| Instrumentation | `CheckoutSuccessTest` | Address → review totals → simulate success → M-14 shows the returned reference and status |
| Instrumentation | `CheckoutFailureTest` | Simulate failure → M-14 shows the failed payment and a safe retry; no "paid" text appears |

Criteria mapping: **a** = E.3/E.4/E.5 and the simulated-payment labelling; **b** = the absence of any
card field plus the D/E test that no such input exists in the layouts; **c** = E.5/E.6; **d** = E.7.

### E.8 Evidence

Test output, screenshots of M-11..M-14 for both outcomes, and a short record of one deliberately
interrupted request showing that no duplicate order was created.

---

## F. ORD-002 — Order history and details

Screens: **M-15** order history, **M-16** order details.

### F.1 Operations consumed

| Operation | Used by |
|-----------|---------|
| `GET /orders` | M-15, paginated |
| `GET /orders/{orderId}` | M-16 |

### F.2 Files owned

```
orders/OrderRepository.java
orders/OrderListViewModel.java
orders/OrderDetailViewModel.java
orders/OrderListFragment.java
orders/OrderDetailFragment.java
orders/OrderAdapter.java
res/layout/fragment_order_list.xml
res/layout/fragment_order_detail.xml
res/layout/item_order_card.xml
res/layout/item_order_line.xml
res/layout/item_order_timeline_event.xml
res/navigation/nav_orders.xml
res/values/strings_orders.xml
res/drawable/ic_empty_orders.xml
test: orders/OrderRepositoryTest.java, orders/OrderViewModelTest.java, orders/OrderStatusTest.java
androidTest: orders/OrderHistoryTest.java
```

### F.3 Behaviour rules

- M-15 lists the signed-in customer's orders newest first with reference, date, USD total, and status.
  Empty state says there are no orders yet with one action to Explore.
- Pagination appends pages; pull-to-refresh reloads page 1.
- M-16 renders immutable snapshots: item names and unit prices as purchased, the shipping-address
  snapshot, subtotal, sample shipping, total, payment result, and the current status with the timeline
  entries the API returns. Customer-side editing of any of these is impossible by construction.
- A status or payment status is rendered as text plus semantic colour — never colour alone.
- Any `404` (including another customer's order id) renders the not-found state, not an error page: the
  server deliberately does not distinguish missing from not-owned.
- Absent or empty timeline entries: render the current status only; do not invent transitions.
- No status filtering, search, or date filters in the first release.

### F.4 Tests

| Level | Test | Proves |
|-------|------|--------|
| JVM | `OrderRepositoryTest` (MockWebServer + fixtures) | List and detail parsing, money-as-string, timeline ordering, `404`, `401`, `429`, pagination |
| JVM | `OrderViewModelTest` | loading/empty/content/error states; append vs refresh; stale order handling |
| JVM | `OrderStatusTest` | Every status and payment status maps to a text resource and a semantic colour; no status renders blank |
| Instrumentation | `OrderHistoryTest` | M-15 → tap an order → M-16 shows the same reference and total; back returns to the list position |

Criteria mapping: **a** = F.3 snapshot rendering; **b** = F.3 empty/loading/error/404 handling;
**c** = F.4.

### F.5 Evidence

Test output, screenshots of the populated list, empty list, detail with a completed payment, detail with
a failed payment, and the not-found state.
