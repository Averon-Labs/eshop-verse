# Android Phase 0 — Foundation Implementation Spec

Companion to the canonical Phase 0 steps in [`../ANDROID_ROADMAP.md`](../ANDROID_ROADMAP.md). This
document supplies the implementation detail the acceptance criteria deliberately omit: exact files,
exact configuration, and the defects that must be closed. It does **not** restate acceptance criteria
and it does not authorize new features.

Read this section only if you own a Phase 0 task. Screen tasks read their own phase spec.

---

## A. Why Phase 0 grew

The original roadmap went straight from `FND-001` (a verified empty scaffold) to `AUTH-002` (customer
auth screens). Five cross-cutting layers that *every* screen depends on had no owner:

| Missing layer | Consequence if left unowned |
|---------------|-----------------------------|
| Dependency and toolchain state | Every feature task edits `libs.versions.toml`, and the app is built on a 2023-era AndroidX stack under a 2026 toolchain |
| Design token and component styles | Seventeen screens each invent their own button, field, and card styling |
| App shell and navigation | `nav_graph.xml`, `MainActivity`, and the bottom navigation are edited by three parallel tasks |
| Network and API client core | Five tasks implement Retrofit setup, error-envelope mapping, and 401 handling five times, differently |
| Money, API models, secure token storage | Money formatting is reimplemented per screen; tokens are stored ad hoc without backup exclusion |

Phase 0 closes those gaps so that Phase 1 and Phase 2 tasks are additive, parallel-safe, and only
touch files they own.

---

## B. Environment prerequisites

Required before any Phase 0 task can be verified. Recorded from the official AGP 9.2 release notes
(checked 2026-10-09).

| Requirement | Value | Notes |
|-------------|-------|-------|
| JDK | **17 or newer** | AGP 9.2 minimum *and* default. JDK 8 cannot build this project. |
| Gradle | 9.4.1 | Already pinned in `android/gradle/wrapper/gradle-wrapper.properties`; the wrapper JAR is tracked. |
| Android SDK Platform | API 36 (extension level 1) | Matches `compileSdk { version = release(36) { minorApiLevel = 1 } }`. |
| SDK Build Tools | 36.0.0 | AGP 9.2 minimum *and* default. |
| `ANDROID_HOME` / `local.properties` | Points at the installed SDK | `local.properties` is git-ignored; never commit it. |
| Emulator/AVD | One device at API 36 (and ideally one at API 25) | Needed by `connectedDebugAndroidTest`. |

### Known verification gap — must be closed by FND-006

The current working checkout has **JDK 8 only**, no `JAVA_HOME`, no `ANDROID_HOME`, and no Android SDK
installation. The Gradle commands recorded in [`../DEVELOPMENT.md`](../DEVELOPMENT.md) therefore
**cannot be reproduced in this environment**, and `FND-001`'s evidence is not independently
reproducible here. `FND-006` must record a real command transcript on a machine that satisfies the
table above.

> Do not report an Android task as verified on a machine that cannot run the Gradle commands. Report
> the missing prerequisite instead.

### Git hazards already fixed or still required

- `.gitattributes` now pins `* text=auto eol=lf`, `android/gradlew` to LF, and `*.bat` to CRLF.
  Without it, a Windows checkout converts the wrapper script to CRLF and Linux CI fails with
  `bad interpreter`.
- `android/gradlew` was staged as mode `100644`; it is now `100755`. Confirm it stays executable
  (`git ls-files -s android/gradlew` must show `100755`), otherwise `./gradlew` fails with
  *Permission denied* in CI.

---

## C. Execution waves

Phase 0 tasks are ordered so two agents never need the same file. Waves are sequential; tasks inside a
wave are parallel-safe.

| Wave | Tasks (parallel) | Files they touch |
|------|------------------|------------------|
| 1 | `FND-006` | `gradle/*`, `app/build.gradle.kts`, `.github/workflows/ci.yml`, `xml/` deletions |
| 2 | `UI-002`, `DOM-002`, `DATA-002` | `res/values/*`, `res/font/*`, `core/money/*`, `core/model/*`, `core/state/*`, `core/storage/*` |
| 3 | `APP-002`, `NET-002` | `MainActivity`, `res/layout/*`, `res/navigation/*`, `res/menu/*`, `AndroidManifest.xml`, `core/net/*`, `res/xml/network_security_config*` |

Wave 1 must land first: everyone else depends on the declared dependency set and cannot change it.

---

## D. FND-006 — Toolchain, dependency, and test-harness modernization

### D.1 Dependency target set

Versions below were read from Google's Maven metadata on 2026-10-09. Re-check for a newer patch at
implementation time and record the final choice; do **not** silently keep the current versions.

| Artifact | Current | Target | Why |
|----------|---------|--------|-----|
| `com.google.android.material:material` | 1.10.0 | **1.14.0** | Material 3 components, theme attributes, and `colorSurfaceContainer*` roles used by UI-002 |
| `androidx.appcompat:appcompat` | 1.6.1 | **1.8.0** | AppCompat/Material integration, `EdgeToEdge` support |
| `androidx.navigation:navigation-fragment`, `-ui` | 2.6.0 | **2.10.2** | Nested graphs, menu/destination matching, type-safe args |
| `androidx.constraintlayout:constraintlayout` | 2.1.4 | **2.2.2** | Layout engine used by every screen |
| `androidx.core:core` | absent (transitive) | **1.19.1** | Declared explicitly; insets and `WindowCompat` APIs are used directly |
| `androidx.recyclerview:recyclerview` | absent | **1.4.0** | Every list screen; `ListAdapter`/`DiffUtil` |
| `androidx.lifecycle:lifecycle-viewmodel`, `-livedata` | absent | latest stable 2.x | MVVM per `docs/ARCHITECTURE.md` |
| `androidx.activity:activity` | `activity-ktx` 1.8.0 | latest stable | Replaces the Kotlin artifact in a Java-only project; `EdgeToEdge` lives here |
| `androidx.fragment:fragment` | absent (transitive) | latest stable | Explicit dependency for `Fragment`/`FragmentManager` APIs used directly |
| `androidx.swiperefreshlayout:swiperefreshlayout` | absent | latest stable | Pull-to-refresh required by catalog/cart/order retry states |
| `com.squareup.retrofit2:retrofit` + `converter-gson` | absent | latest stable | DECIDED in `docs/ARCHITECTURE.md` (NET-002) |
| `com.squareup.okhttp3:okhttp` + `logging-interceptor` | absent | latest stable | Auth interceptor and debug logging (NET-002) |
| `com.github.bumptech.glide:glide` | absent | latest stable | DECIDED in `android/AGENTS.md` (CAT-002) |
| Token storage | absent | see DATA-002 | Decision **OPEN-6** |
| `junit:junit` | 4.13.2 | 4.13.2 | Keep; `docs/TESTING.md` requires JUnit 4 |
| `org.mockito:mockito-core` | absent | latest stable 5.x | Required by `docs/TESTING.md`; currently required but unavailable |
| `com.squareup.okhttp3:mockwebserver` | absent | same version family as `okhttp` | Fixture-driven API-client tests |
| `androidx.arch.core:core-testing` | absent | latest stable | `InstantTaskExecutorRule` for LiveData assertions in JVM tests |
| `androidx.test.ext:junit` | 1.1.5 | latest stable | Instrumentation runner |
| `androidx.test.espresso:espresso-core` | 3.5.1 | latest stable | UI tests per `docs/TESTING.md` |

Rules:

- Declare the **complete** merged set above in `gradle/libs.versions.toml` in this task, so no feature
  task ever edits a Gradle file. If a feature later needs a dependency, that is an escalation, not a
  local edit.
- Prefer pure-JVM unit tests. Do **not** add Robolectric in Phase 0; add it only if a specific test
  genuinely cannot be written without Android classes, and record that decision.
- No Kotlin dependencies in the app module. AGP 9 provides built-in Kotlin support, but this project is
  Java/XML and `activity-ktx` must not be reintroduced.

### D.2 Build configuration changes

- `buildFeatures { buildConfig = true }` plus a `debug`/`release` `buildConfigField("String", "API_BASE_URL", ...)`:
  debug defaults to `http://10.0.2.2:8081/api/v1` (mock server), release to the OPEN-1 host. Allow a
  `-PapiBaseUrl=` override for a physical device or a real local Laravel server.
- Keep `viewBinding = true`; all screens use view binding, never `findViewById`.
- Add `isShrinkResources`/R8 evaluation for `release` only as a documented decision. Leaving
  `isMinifyEnabled = false` is acceptable for the demo **only if** `docs/DEVELOPMENT.md` records it as
  a known limitation.
- `gradle.properties`: set `android.nonTransitiveRClass=true`. Evaluate `org.gradle.caching` and the
  configuration cache; enable them only if `clean assembleDebug`, `lint`, and `testDebugUnitTest` stay
  green with them on.

### D.3 Resource cleanup

- Delete `app/src/main/res/values-v23/themes.xml`. With `minSdk 25` a `-v23` qualifier always applies,
  so the file is dead weight that duplicates the base theme and hides real theme values.

### D.4 Android CI job

Add an `android` job to `.github/workflows/ci.yml`:

- `actions/checkout` (no persisted credentials, consistent with the existing job),
  `actions/setup-java` with `temurin` 17 and Gradle caching,
- `working-directory: android`, run `./gradlew --no-daemon clean assembleDebug lintDebug testDebugUnitTest`.
- Do not run `connectedDebugAndroidTest` in CI in this phase; it needs an emulator runner. Record it as
  a local-only check.

Coordination note: `FND-005` owns cross-component CI consolidation and required status checks. FND-006
adds the **Android job only** and must not renumber or disable the existing `validate` job.

### D.5 FND-006 tests and evidence

- One real JVM test must exist and pass at the end of this task. An empty/`NO-SOURCE` test run does not
  prove the harness works, and `FND-001` left that gap open. A minimal pure-JVM test over a Phase 0
  utility (for example `MoneyTest`) is sufficient to prove JUnit, Mockito, and the fixture loader work.
- Record the exact commands and their output in `docs/DEVELOPMENT.md`, replacing the "exact commands
  will be documented" language where it is now answerable and correcting the stale
  `docs/ROADMAP.md` line that still says the Android commands are unconfirmed.

---

## E. UI-002 — Design token and component style layer

Materializes [`../DESIGN_SYSTEM.md`](../DESIGN_SYSTEM.md) into Android resources so no screen task has
to invent styling. **Every value used by a screen must exist as a resource after this task.**

### E.1 Colour roles

`DESIGN_SYSTEM.md` names twelve palette colours. Material 3 needs the full role set or it generates
off-brand tones for chips, snackbars, dialogs, and badges. Define all of these in
`values/colors.xml`, mapped to the brand palette:

| M3 role | Value | M3 role | Value |
|---------|-------|---------|-------|
| `colorPrimary` | `#F7767E` | `colorSurface` | `#FFFFFF` |
| `colorOnPrimary` | `#161616` | `colorOnSurface` | `#161616` |
| `colorPrimaryContainer` | `#FFF0F1` | `colorSurfaceVariant` | `#F5F6F7` |
| `colorOnPrimaryContainer` | `#B92F3D` | `colorOnSurfaceVariant` | `#6B6B6B` |
| `colorSecondary` | `#B92F3D` | `colorSurfaceContainerLowest` | `#FFFFFF` |
| `colorOnSecondary` | `#FFFFFF` | `colorSurfaceContainerLow` | `#FAFAFB` |
| `colorSecondaryContainer` | `#FFF0F1` | `colorSurfaceContainer` | `#F5F6F7` |
| `colorOnSecondaryContainer` | `#B92F3D` | `colorSurfaceContainerHigh` | `#EFF0F2` |
| `colorTertiary` | `#505050` | `colorSurfaceContainerHighest` | `#E7E8EA` |
| `colorOnTertiary` | `#FFFFFF` | `colorOutline` | `#E7E8EA` |
| `colorTertiaryContainer` | `#ECEDEF` | `colorOutlineVariant` | `#EFF0F2` |
| `colorOnTertiaryContainer` | `#161616` | `colorBackground` | `#F5F6F7` |
| `colorError` | `#B3261E` | `colorOnBackground` | `#161616` |
| `colorOnError` | `#FFFFFF` | `colorSurfaceTint` | `#F7767E` |
| `colorErrorContainer` | `#FCEEEE` | `colorInverseSurface` | `#161616` |
| `colorOnErrorContainer` | `#B3261E` | `colorInverseOnSurface` | `#FFFFFF` |
| `colorScrim` | `#000000` | `colorInversePrimary` | `#F7767E` |

Status semantics for badges and inline state (used by every screen, so they are defined here):

| Semantic | Foreground | Container |
|----------|-----------|-----------|
| Success / delivered / completed | `#256B4B` | `#E8F3ED` |
| Warning / pending | `#8A5300` | `#FBF1E3` |
| Error / failed / cancelled | `#B3261E` | `#FCEEEE` |
| Neutral / informational | `#505050` | `#EFF0F2` |

### E.2 Contrast defect — `text_secondary` fails WCAG AA

Measured with the WCAG relative-luminance formula:

| Pair | Ratio | Verdict |
|------|-------|---------|
| `#777777` on `#FFFFFF` (**current**) | **4.48:1** | **FAILS** AA for normal text (needs 4.5:1) |
| `#777777` on `#F5F6F7` (**current**) | **4.14:1** | **FAILS** with margin |
| `#6B6B6B` on `#FFFFFF` (proposed) | 5.33:1 | passes |
| `#6B6B6B` on `#F5F6F7` (proposed) | 4.92:1 | passes |

`DESIGN_SYSTEM.md` requires 4.5:1 for normal text and `SCREEN_SPECIFICATIONS.md` uses this colour for
12sp supporting copy, so the current value is a genuine accessibility failure, not a theoretical one.

Required work: replace the supporting-text token with a passing value (`#6B6B6B` proposed), update
`DESIGN_SYSTEM.md` **and** `values/colors.xml` in the same commit, and add a measured contrast table to
the task evidence covering every foreground/background pair the app actually uses, including the new
status containers. Confirm the status pairs above at implementation time rather than trusting them.

### E.3 Typography

- Lato weights required by the typography table: `400`, `600`, `700`. If the chosen Lato distribution
  has no 600 weight, decide explicitly which file represents "600" (Medium or Semibold), record it, and
  update the table so the document and the resources agree. Do not ship a weight the document does not
  name.
- **minSdk 25 constraint:** a multi-weight `<font>` *family* XML in `res/font/` is only parsed on
  API 26+. On API 25 the weights silently collapse. Store each weight as its own file
  (`res/font/lato_regular.ttf`, `lato_semibold.ttf`, `lato_bold.ttf`) and select the exact file per
  text style instead of relying on `fontWeight` resolution.
- Define one `TextAppearance.EShopVerse.*` style per row of the typography table in
  `res/values/type.xml`: `LargeTitle`, `PageTitle`, `SectionTitle`, `ComponentTitle`, `Body`,
  `Supporting`, `ActionLabel`.
- Bundle the OFL licence text with the fonts and reference it from `README.md`. Do not rely on a
  runtime download; ADR-002 requires locally bundled fonts.
- **Prerequisite:** if the implementation environment has no network access, the owner must place the
  three Lato files in `android/app/src/main/res/font/` before this task starts. Record the upstream
  source and version in the commit.

### E.4 Component styles (`res/values/styles.xml`)

| Style | Notes |
|-------|-------|
| `Widget.EShopVerse.Toolbar` | Shared top app bar |
| `Widget.EShopVerse.BottomNavigation` | Four destinations; item colours and active indicator from tokens |
| `Widget.EShopVerse.Button.Filled` / `.Outlined` / `.Text` / `.Icon` | Ink on coral for filled; coral-strong for text/icon on white |
| `Widget.EShopVerse.TextInputLayout.Outlined` (+ `.Error`, `.HelperText`) | All forms |
| `Widget.EShopVerse.DropdownMenu` | Category and sort selectors |
| `Widget.EShopVerse.Card.Product` / `.Order` / `.Category` | 12dp radius, elevation 1 |
| `Widget.EShopVerse.Card.Panel` | 16dp radius for forms and dialogs |
| `Widget.EShopVerse.Chip.Filter` | Removable filter chips |
| `Widget.EShopVerse.Badge.Status` | Text-plus-colour status; never colour alone |
| `Widget.EShopVerse.Snackbar` | Success/error feedback |
| `Widget.EShopVerse.ProgressIndicator` | Circular and linear |
| `Widget.EShopVerse.Dialog` | Confirmation dialogs |

### E.5 Shared custom views — owned here, used by multiple features

These appear on more than one screen, so per-feature implementations would diverge:

| View | Used by | Contract |
|------|---------|----------|
| `view/QuantityStepperView` | M-05 product detail, M-10 cart | `setQuantity`, `getQuantity`, `setMin`, `setMax`; emits one change event per user action; 48dp targets; content descriptions |
| `view/PriceTextView` | Every money display | Renders a decimal **string**; never parses into a `double`; uses `MoneyFormat` |
| `view/StateContainerView` | Every data-driven screen | Swaps between loading, content, empty, and error/retry with one API; the error state exposes a retry callback |
| `view/StatusBadgeView` | Order status, payment status, catalog status | Text label plus semantic colour from the status tokens |

These live under `com.averonlabs.eshopverse.core.ui.view` and are the only custom views the first
release adds. Anything else must reuse a Material 3 component.

### E.6 Theme and night-mode defect

Current state: `values-night/themes.xml` duplicates the light palette, while `values-v23/themes.xml`
sets `android:windowLightStatusBar` to `?attr/isLightTheme`. In night mode `isLightTheme` becomes
`false` while the palette stays light, which produces light status-bar icons on a light background.

Required work:

- Delete `values-night/themes.xml`. Delete `values-v23/themes.xml` (§D.3).
- Change the parent to `Theme.Material3.Light.NoActionBar` so the light baseline is explicit rather
  than "DayNight that happens to be overridden", matching the documented decision that dark mode is
  deferred.
- Set `android:windowLightStatusBar = true` and, in `values-v27/themes.xml`,
  `android:windowLightNavigationBar = true`.
- Set `android:forceDarkAllowed = false` so the platform's automatic darkening cannot distort the
  brand palette on API 29+.
- `values-land/`, `values-w600dp/`, `values-w1240dp/` remain; keep `screen_horizontal_margin` as the
  single responsive gutter token and add `touch_target_min = 48dp`.

### E.7 UI-002 tests and evidence

- JVM tests for `QuantityStepperView` bounds and `PriceTextView` formatting (pure logic extracted from
  the views so the tests need no Android framework).
- An instrumentation test that inflates each shared view from its style and asserts it renders without
  a resource error.
- The measured contrast table (§E.2).
- `lint` clean with the design-system checkpoints from `DESIGN_SYSTEM.md` satisfied.

---

## F. APP-002 — App shell and navigation

Owns the shared shell files so no feature task ever needs to edit them.

### F.1 Files owned

| File | Content |
|------|---------|
| `AndroidManifest.xml` | `<uses-permission android:name="android.permission.INTERNET"/>`, `ACCESS_NETWORK_STATE`, the launcher activity, and the `networkSecurityConfig` reference |
| `MainActivity.java` | Single activity, `EdgeToEdge`, toolbar, bottom navigation, nav host |
| `res/layout/activity_main.xml`, `content_main.xml` | App bar + nav host + bottom navigation |
| `res/menu/bottom_nav_menu.xml` | Four items with fixed ids |
| `res/menu/menu_home.xml` | Top bar search and profile actions |
| `res/drawable/ic_home.xml`, `ic_explore.xml`, `ic_cart.xml`, `ic_account.xml`, `ic_search.xml`, `ic_cart_badge.xml` | Upstream Material Symbols vector drawables, committed locally |
| `res/navigation/nav_main.xml` + five nested graphs | See §F.2 |
| `res/xml/network_security_config.xml` (main) and `app/src/debug/res/xml/network_security_config.xml` | Release: no cleartext. Debug: cleartext **only** for `10.0.2.2` and `localhost` |
| `values/strings.xml` | App-level strings only (app name, tab labels, top-bar labels). Features use `strings_<feature>.xml` |
| `shell/` package | `HomeFragment`, `ExploreFragment`, `CartFragment`, `AccountFragment` host stubs |

### F.2 Navigation ownership — the parallelism contract

`nav_main.xml` is owned by APP-002 and defines **fixed interface ids and arguments** that feature tasks
depend on. Feature tasks fill in their own nested graph and never touch `nav_main.xml`.

| Nested graph | Root id | Declared arguments | Owner |
|--------------|---------|-------------------|-------|
| `nav_catalog.xml` | `nav_catalog` | none | CAT-002 |
| `nav_auth.xml` | `nav_auth` | `returnToNavId` (reference) | AUTH-002 |
| `nav_cart.xml` | `nav_cart` | none | CART-002 |
| `nav_checkout.xml` | `nav_checkout` | `shippingAddressId` (string, optional) | CHECK-001 |
| `nav_orders.xml` | `nav_orders` | `orderId` (int, optional) | ORD-002 |

Rules:

- A feature graph's start destination is set by the owning feature. APP-002 ships each graph with a
  single placeholder destination so the app compiles and boots before the features exist.
- Cross-feature navigation targets **graph ids only**, never another feature's destinations. This is
  what allows CART-002, CHECK-001, and ORD-002 to run in parallel.
- Bottom navigation uses the four shell host stubs, not feature fragments, so the tab layout is stable
  across the whole project.
- **Risk with a documented fallback:** matching bottom-navigation menu ids to included nested-graph ids
  is a supported but fiddly Navigation pattern. If it misbehaves on Navigation 2.10.2, APP-002 may
  instead declare four top-level `<fragment>` destinations in `nav_main.xml` for the tabs. Record which
  approach was used and why. If the fallback is chosen, `nav_main.xml` remains APP-002-owned and feature
  tasks still only edit their own graphs.

### F.3 Edge-to-edge and insets defect

Current `MainActivity` applies **all** system-bar insets as padding on the root `CoordinatorLayout`
while the same view hierarchy already sets `fitsSystemWindows="true"` on both `CoordinatorLayout` and
`AppBarLayout`. That double-handles insets and can produce extra top and bottom spacing, directly
contradicting the design-system requirement to respect system bars and keyboard insets.

Required approach:

- Call `EdgeToEdge.enable(this)` and set `fitsSystemWindows="false"` on the root and app bar.
- Apply the **top** inset to the `AppBarLayout` and the **bottom** inset to the bottom navigation — not
  the whole inset rect to the root.
- Apply the **left/right** insets to the root as horizontal padding only.
- Apply `ime` insets only where a form or sticky action must stay above the keyboard (checkout and auth
  screens keep their own handling; the shell provides the pattern and a documented rule).
- Verify on a gesture-navigation device or emulator that nothing is clipped and no blank band appears.

### F.4 Shell behaviour

- Cart badge shows the item count when non-zero; the badge value is driven by cart state, so APP-002
  defines the badge API and CART-002 supplies the count. Until CART-002 lands the badge stays hidden.
- Top bar shows the text wordmark `EShop Verse`, a search action, and an account action, per
  `SCREEN_SPECIFICATIONS.md`.
- Bottom navigation is hidden on focused detail/auth/checkout steps. Implement it as a
  destination-based rule in one place, so feature tasks do not each re-implement it.
- Back navigation follows Android conventions and must never resubmit a payment or order mutation.
- `MainActivity` holds no business logic; it wires the nav controller and the shell only.

### F.5 APP-002 evidence

- Instrumentation test: the app boots to the Home destination, all four tabs are reachable, and the
  layout has no clipped content with system bars visible.
- Screenshot of the shell at 360dp and at a tablet width.
- `lint` clean.
- `git status --short` shows no file outside the §F.1 whitelist.

---

## G. DOM-002 — Money, API models, and shared UI state

One implementation of the decisions that would otherwise be duplicated across five screens.

### G.1 Contents

| Package | Class | Contract |
|---------|-------|----------|
| `core.money` | `Money` | `BigDecimal`-backed, always scale 2, `HALF_UP`. `parse(String)`, `plus`, `minus`, `times(int)`, `isZero`, `compareTo`, `equals`/`hashCode`. No constructor or accessor exposes `double` or `float`. |
| `core.money` | `MoneyFormat` | `format(Money)` and `format(String decimal)` for en-US USD (`$1,234.56`). Single place that touches `NumberFormat`. |
| `core.model` | API models | The complete Phase 1–2 model set generated from `docs/openapi.yaml`: `User`, `AuthSession`, `Category`, `ProductSummary`, `ProductDetail`, `ProductImage`, `Cart`, `CartItem`, `CheckoutQuote`, `ShippingAddress`, `Order`, `OrderSummary`, `OrderItem`, `OrderPayment`, `OrderStatusEvent`, `PaymentResult`, `AdminProduct`, `InventoryRow`, enums. |
| `core.state` | `UiState<T>` | `Loading`, `Content`, `Empty`, `Error(messageRes, retryable)`. |
| `core.state` | `Event<T>` | One-shot event so rotation does not re-fire navigation or a snackbar. |
| `core.state` | `Paged<T>` | `items`, `currentPage`, `perPage`, `totalItems`, `totalPages`, `hasMore`. |
| `core.error` | `ApiErrorCodes` | Constants for every code in `x-error-codes`. |
| `core.error` | `ErrorMessages` | `code` to string-resource mapping, with a generic fallback. |

### G.2 Rules

- Money fields are **strings** end to end. A test asserts a fixture containing `"19.99"` never becomes
  a `double` anywhere in the model layer.
- Models are populated from the contract, not from the screens. A screen that needs an extra field
  escalates; it does not fork a model.
- Every documented error code has a string resource and a test proving the mapping is total, so an
  unknown code cannot render an empty message.

### G.3 DOM-002 evidence

- JVM tests: money arithmetic, rounding at the half-up boundary, formatting, malformed input rejection,
  `UiState`/`Event` behaviour, and total error-code coverage.
- A checked list mapping each model to its `docs/openapi.yaml` schema name.

---

## H. DATA-002 — Secure token storage and local persistence decision

### H.1 Secure token store

| Aspect | Requirement |
|--------|-------------|
| Interface | `core.storage.TokenStore` — `save(token, expiresAt)`, `read()`, `clear()`, `isExpired()`. |
| Backing | Platform-protected storage only. Never plain `SharedPreferences`, never a file in external storage, never `local.properties`, never source control. |
| Key material | Must not be exportable; no hard-coded key in the APK. |
| Logging | No token value, prefix, or length may reach any log, crash report, or `toString()`. Override `toString()` to redact. |
| Lifecycle | `clear()` on sign-out, on a rejected/expired session, and on a password reset. |
| Backup | Excluded from cloud backup and device-to-device transfer. |

**Decision OPEN-6.** Choose between (a) `androidx.security:security-crypto`
`EncryptedSharedPreferences`, or (b) a small AES-GCM store backed by the Android Keystore. Verify the
maintenance status of `security-crypto` before choosing; do not assume it is the recommended option in
2026. Record the choice and its rationale as an ADR, because it is a security-relevant decision.

### H.2 Backup and restore

- Recommend `android:allowBackup="false"` for this demo, plus explicit exclusions in
  `res/xml/data_extraction_rules.xml` for the token store on device transfer.
- Justify either choice in the task evidence. The failure mode to prevent is a restored device holding
  an encrypted blob whose Keystore key no longer exists, alongside a token that should not have left
  the device.

### H.3 Room — resolve the contradiction

`docs/ARCHITECTURE.md` and `README.md` list Room as `DECIDED`, but no first-release acceptance
criterion requires an offline cache, and no task owns local persistence. Shape the decision
explicitly:

- **Recommended:** defer Room for the first release, document the deferral in `docs/ARCHITECTURE.md`
  and `README.md`, and note it under deferred work. Catalog, cart, and order state come from the API;
  a cache would add invalidation rules the demo does not need.
- If Room is kept, it must get a scoped task with a named offline requirement, and `DATABASE.md`-style
  local schema documentation.

Do not leave the documents asserting a decision the code does not implement.

### H.4 DATA-002 evidence

- JVM tests with a fake `TokenStore` covering expiry, clear-on-logout, and redacted `toString()`.
- An instrumentation test that writes and reads a token through the real Keystore-backed store on an
  API 25 and an API 36 emulator.
- Proof that the store is excluded from backup (rules file content plus the manifest attribute).

---

## I. NET-002 — Network and API client core

### I.1 Contents

| Class | Responsibility |
|-------|----------------|
| `core.net.ApiClient` | Builds one `OkHttpClient` and one `Retrofit` instance from `BuildConfig.API_BASE_URL`. |
| `core.net.ApiRoutes` | Retrofit interface; one method per `docs/openapi.yaml` operation used in Phases 1–2. |
| `core.net.AuthInterceptor` | Adds `Authorization: Bearer <token>` from `TokenStore` when a token exists; never logs it. |
| `core.net.IdempotencyInterceptor` | Adds a fresh `Idempotency-Key` UUID to `POST /orders` and `POST /orders/{orderId}/payment`; retries reuse the key already used for that logical attempt. |
| `core.net.ApiErrorMapper` | Parses the error envelope into `ApiException(code, message, fieldErrors)`. |
| `core.net.ApiException` | Carries `httpStatus`, `code`, `message`, `fieldErrors`. |
| `core.net.UnauthenticatedHandler` | One hook invoked on `401` so session policy lives in one place, owned by the app rather than by each screen. |
| `core.net.PagedResponse<T>` | Envelope for `{ data, pagination }`. |

### I.2 Client configuration

- Timeouts: connect 10s, read 20s, full call 30s.
- Logging interceptor is attached **only** in the debug build, at `Level.BASIC`, with
  `redactHeader("Authorization")`. `Level.BODY` is never enabled: it would write passwords and tokens
  into logcat.
- No automatic retry of mutations. `GET` requests may retry once on timeout or 5xx; `POST`/`PATCH`/
  `PUT`/`DELETE` never auto-retry, because duplicate submission safety is a product requirement.
- No certificate pinning in the first release; record it as deferred rather than silently absent.
- Cleartext is permitted only in the debug build for `10.0.2.2` and `localhost` (§F.1).

### I.3 Tests

MockWebServer-driven JVM tests, loading fixtures from the shared fixture directory
(see [`API-MOCK-STRATEGY.md`](API-MOCK-STRATEGY.md)):

| Test | Proves |
|------|--------|
| success envelope parsing | Models, pagination, and money-as-string survive a round trip |
| error envelope mapping | `code`, `message`, and `fieldErrors` are populated for 401/404/409/422/429/500 |
| auth header | Present when a token exists, absent when it does not, never logged |
| 401 hook | `UnauthenticatedHandler` is invoked exactly once per failed call |
| idempotency key | Same logical attempt reuses one key; a new attempt uses a new key |
| no-retry rule | A `409` on a mutation produces exactly one request |
| pagination | `PagedResponse` exposes `hasMore` correctly at the last page |

### I.4 NET-002 evidence

Full test run output plus a record of the base URL used, so the mock-versus-real distinction is
explicit.

---

## J. Defect register closed by Phase 0

| # | Defect | Where | Closed by |
|---|--------|-------|-----------|
| 1 | `INTERNET` and `ACCESS_NETWORK_STATE` permissions absent | `AndroidManifest.xml` | APP-002 |
| 2 | No cleartext policy; local HTTP development will fail on Android 9+ | missing resource | APP-002 |
| 3 | Light status-bar icons on a light background in night mode | `values-night`, `values-v23` | UI-002 |
| 4 | System-bar insets applied twice | `MainActivity`, `activity_main.xml` | APP-002 |
| 5 | `allowBackup="true"` with empty backup/extraction rules and no token exclusion | manifest, `res/xml` | DATA-002 |
| 6 | Only ~13 of the Material 3 colour roles defined; off-brand generated tones | `values/themes.xml` | UI-002 |
| 7 | Supporting text contrast 4.48:1 on white, 4.14:1 on canvas — fails WCAG AA | `values/colors.xml` | UI-002 |
| 8 | AndroidX stack three years behind the toolchain | `libs.versions.toml` | FND-006 |
| 9 | `activity-ktx` (Kotlin) in a Java-only app | `libs.versions.toml` | FND-006 |
| 10 | Dead `values-v23` theme | `res/values-v23` | FND-006 |
| 11 | Mockito required by `docs/TESTING.md` but not declared | `libs.versions.toml` | FND-006 |
| 12 | Test harness never actually executed (`NO-SOURCE`) | `app/src/test` | FND-006 |
| 13 | `android/gradlew` not executable in the Git index — breaks Linux CI | Git index | fixed in this planning commit; verified by FND-006 |
| 14 | No LF normalization rules — wrapper script breaks on Linux CI | `.gitattributes` | fixed in this planning commit |
| 15 | Room asserted as decided but unimplemented and unowned | `ARCHITECTURE.md`, `README.md` | DATA-002 (§H.3) |
| 16 | Responsive gutter token declared in four resource files with no consumer, so the documented 16/24/32dp gutter is not wired to anything | `values/dimens.xml` and its `-land`, `-w600dp`, `-w1240dp` variants | UI-002 (§E.6) owns the token; every screen task must consume it |
| 17 | Sample card hardcodes `app:cardElevation="1dp"` instead of a shared elevation token, violating the design system's no-hardcoded-elevation rule | `layout/fragment_home.xml` | UI-002 defines the token; CAT-002 replaces the sample screen |
| 18 | Unused Android Studio template colours `black` and `white` duplicate brand tokens and have no consumer | `values/colors.xml` | FND-006 (§D.3) |

---

## K. Open decisions

| ID | Question | Blocks |
|----|----------|--------|
| OPEN-5 | Runner for the local mock server (Python 3 stdlib recommended) | NET-002 completion |
| OPEN-6 | Token storage mechanism: `security-crypto` versus a Keystore-backed AES-GCM store | DATA-002 |
| OPEN-7 | Supporting-text token value (`#6B6B6B` proposed) and the status-container values | UI-002; needs a design-system edit |
| OPEN-8 | Lato weight file chosen for "600" | UI-002 |
| OPEN-9 | `allowBackup` for the demo app (recommend `false`) | DATA-002 |
| OPEN-10 | Room deferred for the first release (recommended) | DATA-002; needs an `ARCHITECTURE.md` edit |
| OPEN-11 | Lato font files must be placed in the repository before UI-002 starts | UI-002 |
