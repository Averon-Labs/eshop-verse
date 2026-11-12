# Android Phase 1 — Accounts and Catalog Implementation Spec

Companion to the canonical Phase 1 steps in [`../ANDROID_ROADMAP.md`](../ANDROID_ROADMAP.md). Screen
composition, states, and visual treatment are defined in
[`../SCREEN_SPECIFICATIONS.md`](../SCREEN_SPECIFICATIONS.md) and
[`../DESIGN_SYSTEM.md`](../DESIGN_SYSTEM.md); this document supplies the implementation detail: files,
operations, validation, error mapping, and tests.

Read the Phase 1 section for the task you own. Do not read other phase specs.

---

## A. Entry conditions

- All Phase 0 tasks are complete and their commands are green.
- `docs/openapi.yaml` is **reviewed and accepted**. Phase 1 consumes the contract; it does not invent
  operations. If an operation is missing or wrong, that is a contract-change escalation.
- The local mock server or a real backend answers at `BuildConfig.API_BASE_URL`, and
  `POST /__mock/reset` restores a known state before each manual scenario.
- Lato fonts and the UI-002 styles exist. Phase 1 tasks add **no** colours, dimensions, styles, or
  typography; a missing style is a UI-002 bug report.

## B. Wave plan

| Wave | Tasks (parallel) | Why parallel is safe |
|------|------------------|----------------------|
| 1 | `AUTH-002`, `CAT-002` | Disjoint feature packages, disjoint nested graphs, disjoint `strings_<feature>.xml`, no shared-file edits |

Both tasks may run at the same time. They share only `core/` (already frozen by Phase 0) and
`nav_main.xml` (already frozen by APP-002). Neither may edit the other's files.

Cross-feature navigation uses graph ids only: `nav_auth`, `nav_catalog`. Neither task defines or
references the other's destinations.

## C. Shared conventions for both Phase 1 tasks

| Concern | Rule |
|---------|------|
| Strings | New keys go in `res/values/strings_<feature>.xml` only. App-level keys stay in `values/strings.xml` (APP-002). |
| Layouts | `fragment_<name>.xml`, `item_<name>.xml`, `dialog_<name>.xml`, prefixed by feature where a name could collide. |
| Money | Rendered only through `PriceTextView` / `MoneyFormat`. No arithmetic in a screen or adapter. |
| States | Every network-backed screen uses `StateContainerView` for loading/content/empty/error+retry. |
| Errors | Status/code to message mapping goes through `ErrorMessages`; screens never switch on raw strings. |
| Threading | ViewModels expose results on the main thread; repository calls run off the main thread. |
| View binding | Required. No `findViewById`. |
| Images | Glide only. Neutral placeholder plus a recoverable error drawable. |
| Accessibility | Content descriptions on every interactive element, 48dp targets, TalkBack-safe list items, no colour-only status. |
| Logging | Never log a token, password, email address, or full request body. |

---

## D. AUTH-002 — Customer authentication and profile

Screens: **M-06** sign in, **M-07** create account, **M-08** request password reset, **M-09** set new
password, **M-17** account.

### D.1 Operations consumed

| Operation | Used by |
|-----------|---------|
| `POST /auth/register` | M-07 |
| `POST /auth/login` | M-06 |
| `POST /auth/logout` | M-17 |
| `GET /auth/profile` | M-17 |
| `PATCH /auth/profile` | M-17 |
| `POST /auth/password-reset` | M-08 |
| `POST /auth/password-reset/confirm` | M-09 |

### D.2 Files owned

```
auth/AuthRepository.java
auth/AuthViewModel.java
auth/SessionViewModel.java            # app-wide session state, cart-independent
auth/SignInFragment.java
auth/RegisterFragment.java
auth/RequestPasswordResetFragment.java
auth/SetNewPasswordFragment.java
auth/AccountFragment.java
res/layout/fragment_sign_in.xml
res/layout/fragment_register.xml
res/layout/fragment_request_password_reset.xml
res/layout/fragment_set_new_password.xml
res/layout/fragment_account.xml
res/navigation/nav_auth.xml
res/values/strings_auth.xml
res/drawable/ic_visibility.xml, ic_visibility_off.xml
test: auth/AuthRepositoryTest.java, auth/AuthViewModelTest.java, auth/PasswordValidationTest.java
androidTest: auth/SignInFlowTest.java
```

Must not touch: `values/themes.xml`, `values/colors.xml`, `values/dimens.xml`, `values/styles.xml`,
`AndroidManifest.xml`, `MainActivity.java`, `nav_main.xml`, `values/strings.xml`, any `core/**` file,
any `cart/**`, `checkout/**`, `orders/**`, `catalog/**` file.

### D.3 Validation

Client-side checks mirror the contract; the server remains authoritative.

| Field | Rule | Message source |
|-------|------|----------------|
| Email | Matches the contract's email format; max 254 | `strings_auth.xml` |
| Password | 8–72 characters, at least one letter and one digit | `strings_auth.xml` |
| Confirm password | Must equal password (client-only field; never sent) | `strings_auth.xml` |
| First/last name | 1–80 characters, non-blank after trim | `strings_auth.xml` |
| Reset token | Present in the M-09 deep input; 16–128 characters | `strings_auth.xml` |

Use `TextInputLayout` error state for field-level errors from `error.details`, not a snackbar.

### D.4 Error mapping

| HTTP | `error.code` | Behaviour |
|------|--------------|-----------|
| 401 | `INVALID_CREDENTIALS` | Inline form error on M-06; keep the entered email, clear the password |
| 409 | `EMAIL_ALREADY_REGISTERED` | Inline error on the email field in M-07 |
| 422 | `VALIDATION_ERROR` | Field errors from `error.details` |
| 422 | `RESET_TOKEN_INVALID` | M-09 shows the expired/invalid-token state with a link back to M-08 |
| 429 | `ACCOUNT_LOCKED` | M-06 shows the lockout message and honours `Retry-After`; disable submission until it elapses |
| 429 | `RATE_LIMITED` | Generic "try again shortly" message; honour `Retry-After` |
| 5xx / timeout | — | Retryable error via `StateContainerView`; keep the form input |
| 202 | — | M-08 shows a neutral confirmation and never discloses whether the address exists |

### D.5 Session and token rules

- `POST /auth/login` and `/auth/register` return `token` and `expiresAt`. Persist through
  `TokenStore.save(...)` only.
- `SessionViewModel` exposes signed-in state plus the current `User`. Profile screens observe it; they do
  not re-read `GET /auth/profile` on every screen.
- Sign-out calls `POST /auth/logout`, then `TokenStore.clear()` **regardless of the API result** — a
  failed revoke must still end the local session. Record the failed revoke as a non-fatal outcome.
- On `401` from any call, `UnauthenticatedHandler` clears the session state and routes to M-06 with a
  concise explanation, preserving the originating route so the customer can continue.
- A token whose `expiresAt` has passed is treated as signed out before any request is attempted.
- A successful password reset invalidates local session state (the server revokes all tokens).

### D.6 Return navigation

M-06 accepts the `returnToNavId` argument declared by APP-002. Checkout and cart require a signed-in
customer; when a signed-out customer triggers an auth-required action, navigate to `nav_auth` with the
originating nav id, and after success return there. Do not create a guest cart.

### D.7 Tests

| Level | Test | Proves |
|-------|------|--------|
| JVM | `PasswordValidationTest` | Bounds, letter+digit requirement, blank/whitespace handling |
| JVM | `AuthRepositoryTest` (MockWebServer + fixtures) | Success parsing for all seven operations; mapping of 401/409/422/429; token and `expiresAt` extraction |
| JVM | `AuthViewModelTest` | Loading → content/error transitions; field errors attached to the right field; retry after failure; no duplicate submission while in flight |
| JVM | token integration | `clear()` runs on sign-out even when logout fails; expired token short-circuits a request |
| Instrumentation | `SignInFlowTest` | M-06 → validation error → valid credentials → M-17 shows the name; sign-out returns to M-06 |

Criteria mapping: **a** = D.3/D.4/D.5 states; **b** = D.5 plus the leak check in D.7; **c** = the
JVM tests plus `SignInFlowTest`; **d** = D.5/D.6 patterns and the accessibility rules in §C.

### D.8 Evidence

Gradle output for `testDebugUnitTest` and `connectedDebugAndroidTest`; a `logcat` excerpt from the
sign-in flow showing no token, password, or email value; `git status --short` limited to D.2.

---

## E. CAT-002 — Catalog browsing

Screens: **M-01** Home, **M-02** Explore / all products, **M-03** search results, **M-04** category
products, **M-05** product detail.

### E.1 Operations consumed

| Operation | Used by |
|-----------|---------|
| `GET /categories` | M-01, M-02, M-04 |
| `GET /products` (page, perPage, q, categoryId, inStock, sort) | M-01, M-02, M-03, M-04 |
| `GET /products/{productId}` | M-05 |

### E.2 Files owned

```
catalog/CatalogRepository.java
catalog/CatalogListViewModel.java
catalog/ProductDetailViewModel.java
catalog/CategoryViewModel.java
catalog/fragment/ExploreFragment.java
catalog/fragment/SearchResultsFragment.java
catalog/fragment/CategoryProductsFragment.java
catalog/fragment/ProductDetailFragment.java
catalog/view/ProductCardView.java
catalog/ProductGridAdapter.java
catalog/ImageCarouselAdapter.java
res/layout/fragment_explore.xml
res/layout/fragment_search_results.xml
res/layout/fragment_category_products.xml
res/layout/fragment_product_detail.xml
res/layout/item_product_card.xml
res/layout/item_product_image.xml
res/layout/item_category_chip.xml
res/navigation/nav_catalog.xml
res/values/strings_catalog.xml
res/drawable/ic_sort.xml, ic_clear_search.xml, ic_image_placeholder.xml
test: catalog/CatalogRepositoryTest.java, catalog/CatalogListViewModelTest.java, catalog/ProductParamsTest.java
androidTest: catalog/BrowseToDetailTest.java
```

Must not touch: any `auth/**`, `cart/**`, `checkout/**`, `orders/**`, `core/**` file, the shell files,
`values/strings.xml`, or any shared token/style resource.

`M-01` Home is a catalog-browsing entry point, not a marketing page: it presents catalog content the
app already has. Do not add a hero, banner, or promotional section (`SCREEN_SPECIFICATIONS.md`).

### E.3 Query construction

| Control | Parameter | Rule |
|---------|-----------|------|
| Search | `q` | Submitted by the keyboard action or the search icon — not on every keystroke. Trim, collapse whitespace, send as-is (the server is authoritative). Preserve the query when navigating to M-05 and back. |
| Sort | `sort` | `newest` (default), `price_asc`, `price_desc`, `name_asc`. Changing sort resets `page` to 1. |
| Category | `categoryId` | Selecting a category resets `page` to 1. |
| Pagination | `page`, `perPage` | `perPage` fixed at 20 (contract default). Advancing appends; a short page sets `hasMore = false`. Changing any filter resets to page 1. |
| Availability | `inStock` | Only if a screen exposes it; do not add a control the specification does not define. |

An unknown or archived `categoryId` returns `422 CATEGORY_NOT_FOUND`; the category screen shows the
empty/error state and a link back to Explore rather than retrying forever.

### E.4 Data display rules

- Cards show product image, name, and USD price. Availability appears only when the API supplies it.
- No ratings, no favourite hearts, no discount stickers, no card-level add action, no size/colour
  variants (`SCREEN_SPECIFICATIONS.md` explicitly excludes them).
- `inStock == false` renders a neutral "Out of stock" state and disables the detail-screen add action.
- M-05 shows the ordered image set when present, name, price, description, availability, and a quantity
  stepper bounded by `stockQuantity` (1..min(stock, 99)) using the shared `QuantityStepperView`. The
  sticky coral **Add to cart** action is implemented by CART-002; CAT-002 provides the destination and
  passes `productId`. If the add-to-cart wiring is not yet available, the action is present but
  disabled with a temporary explanation — never a non-functional button that silently does nothing.

**Boundary to respect:** `POST /cart/items` belongs to CART-002. If CART-002 has not landed, coordinate
rather than adding a cart mutation to the catalog package.

### E.5 Image handling

- Glide with a neutral placeholder and an error drawable; a failed image leaves the card layout stable.
- One image request per visible card; no full-size download for a list row.
- No image upload, no caching policy beyond Glide defaults, no disk-cache tuning in the first release.

### E.6 Error and empty states

| Situation | State |
|-----------|-------|
| First load | `StateContainerView` loading (static skeleton, no shimmer) |
| Empty catalog or empty category | Empty state with one relevant action back to Explore |
| No search results | Empty state with **Clear search** plus category browsing |
| Network/server error | Retryable error state; retry re-issues the same request |
| Image failure | Per-image fallback; the rest of the list stays usable |
| `429` | Non-blocking message; honour `Retry-After` before offering retry |

### E.7 Tests

| Level | Test | Proves |
|-------|------|--------|
| JVM | `ProductParamsTest` | Query construction for every sort/search/category/pagination combination; filter changes reset the page |
| JVM | `CatalogRepositoryTest` (MockWebServer + fixtures) | Summary and detail parsing, image ordering, `422 CATEGORY_NOT_FOUND`, `404`, `429`, pagination metadata |
| JVM | `CatalogListViewModelTest` | loading → content → empty; append vs reset; error and retry; no duplicate in-flight page request |
| JVM | money assertion | Prices from fixtures render as `$19.99` and never pass through a `double` |
| Instrumentation | `BrowseToDetailTest` | Explore grid → card tap → M-05 shows the matching name and price; system back returns to the same list position |

Criteria mapping: **a** = E.1/E.3/E.4; **b** = E.5/E.6; **c** = E.4 money rule plus the money assertion;
**d** = E.7.

### E.8 Evidence

Test output, plus screenshots of the list, detail, empty, and error states at 360dp and at a tablet
width, and a note of the mock or backend base URL used.
