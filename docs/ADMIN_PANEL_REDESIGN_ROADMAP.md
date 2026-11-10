# Admin Panel Redesign Roadmap (Evergreen Commerce Design System)

> **Document Status:** Active Execution Roadmap (Reconciled with Laravel Backend & Android Customer App)  
> **Source Design:** Figma `Admin-Dashboard--8-16-` (Evergreen Commerce Admin)  
> **Design Language:** Material 3 Semantic Color System (102 Tokens), Bento Grid, Inverted Border Radius Fillets, High-Contrast Light & Dark Modes  
> **Component Scope:** `admin/` (React 18+, TypeScript, Vite, Tailwind CSS, Vitest)  
> **Integration Targets:** `backend/` (Laravel API v1, Sanctum) & `android/` (Customer App, Material 3, MVVM)

---

## 1. Executive Summary & Design System Foundations

This roadmap details the complete end-to-end visual and architectural redesign of the **EShop Verse Admin Panel**, aligning it 1:1 with the **Evergreen Commerce Admin** Figma specification while adhering strictly to the production reality of our Laravel backend API and Android mobile app.

The redesigned panel is tailored for a boutique store operator: zero redundant bloat (no unneeded multi-tier enterprise RBAC, no fake carrier API credentials, no complex returns logistics), and 100% focus on catalog management, order fulfillment, and fast inventory updates.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Semantic Token Matrix                           │
├──────────────────────────┬──────────────────────┬──────────────────────┤
│ Token Role               │ Light Theme          │ Dark Theme           │
├──────────────────────────┼──────────────────────┼──────────────────────┤
│ bg/background            │ #F7F7FC              │ #0B1021              │
│ bg/sidebar               │ #EDECF6              │ #12182E              │
│ bg/surface (cards)       │ #FFFFFF              │ #161D36              │
│ bg/surface-container     │ #F3F2FA              │ #1D2644 (inputs)     │
│ brand/primary (accent)   │ #6938D3              │ #7C4DFF / #6938D3    │
│ brand/primary-hover      │ #572AB8              │ #8F66FF              │
│ text/on-background       │ #19172A              │ #FFFFFF              │
│ text/secondary           │ #49465D              │ #8C96AB              │
│ border/outline           │ #CAC7D8              │ #252D4A              │
│ status/success-container │ #B9F1CD (text: #064B)│ #133826 (text: #4EFA)│
│ status/warning-container │ #FFEDD5 (text: #9A34)│ #422006 (text: #FDBA)│
│ status/error-container   │ #FFE4E6 (text: #9F12)│ #4C0519 (text: #FDA4)│
│ status/badge-purple      │ #EBDDFF (text: #3D17)│ #2E1A52 (text: #D8B4)│
│ status/badge-blue        │ #D1E9FF (text: #246B)│ #1A365D (text: #90CD)│
└──────────────────────────┴──────────────────────┴──────────────────────┘
```

### 1.1. Key Architectural & Cross-Component Guardrails
- **Pure CSS Inverted Fillet:** The active sidebar item's right-edge curve (`28px` outward scoop) is implemented via CSS pseudo-elements (`::before`, `::after`) and inverted `box-shadow` or inline SVG masks, guaranteeing fluid zero-lag transitions between routes.
- **Theme Switcher:** Instant theme switching between Light (`#F7F7FC`) and Dark (`#0B1021`) via HTML `class="dark"` and CSS custom properties, persisted in `localStorage`.
- **Zero-CLS & Text-First Rendering:** Skeletons match the exact dimensions of final cards to eliminate Cumulative Layout Shift (CLS = 0).
- **Two-Step Product & Stock Orchestration:** The backend decouples product creation (`POST /admin/products`) from inventory quantity (`PATCH /admin/inventory/{id}`). The UI orchestrates this sequentially with atomic loading state.
- **Sequential Multipart Image Upload:** Product images must be uploaded to `POST /admin/products/{id}/images` after the product record ID is generated.
- **Android Money & URL Compatibility:**
  - Prices are formatted strictly as 2-decimal strings (`^\d{1,9}\.\d{2}$`) to prevent parsing crashes in Android's `Money.java`.
  - Image URLs must remain relative `/media/product-images/...` paths so Android's `ImageLoaderHelper.java` can prepend the active API base host (avoiding hardcoded `localhost` issues on mobile devices).
- **Categories Are First-Class:** Even though Figma omitted category management from the main sidebar, Android relies on categories for home screen mood circles and catalog filtering. Category CRUD is preserved as a top-level workspace.
- **Product Lifecycle & Decommission Rules:** Products associated with existing customer orders cannot be hard-deleted via `DELETE /admin/products/{id}` (`409 PRODUCT_HAS_ORDERS`). The panel provides **Archive** (`POST /admin/products/{id}/archive`) as the safe primary decommission action, with fallback modal guidance.
- **Image Upload Constraints & Aspect Ratio:**
  - Endpoint `POST /admin/products/{id}/images` requires multipart field name `image` (max 8 images per product, max 5 MB, MIME types: `jpg, jpeg, png, webp, gif`).
  - Media dropzone advises a 1:1 square aspect ratio matching Android's `centerCrop` product cards (`item_product_card.xml`).
  - Upload order defines `sort_order`: the first image becomes the hero thumbnail in Android catalog grids, subsequent images populate the product detail carousel.
- **Unique SKU Validation:** Unique SKU check gracefully maps `409 SKU_TAKEN` to the SKU input field.
- **Customer Context Scope:** Since the backend manages users via authentication and attaches customer snapshots directly to orders, customer information is surfaced rich and actionable inside the Orders workflow rather than an isolated, disconnected mock table.
- **Order State Machine Strictness:** Transitions follow `OrderStateMachine.php` dynamically via `order.allowedTransitions` to prevent `422/409` conflict errors.

---

## 2. Granular Phases and Actionable Steps

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                  Redesign Phase Flow                                   │
├──────────────────┬──────────────────┬──────────────────┬───────────────────────────────┤
│ Phase 0          │ Phase 1          │ Phase 2          │ Phase 3                       │
│ Tokens & Shell   │ Auth & Legal     │ Products CRUD    │ Inventory & Category Matrix   │
├──────────────────┼──────────────────┼──────────────────┼───────────────────────────────┤
│ Phase 4          │ Phase 5          │ Phase 6          │ Phase 7                       │
│ Orders Workflow  │ Overview (Sales) │ Settings         │ Verification & Test Suite     │
└──────────────────┴──────────────────┴──────────────────┴───────────────────────────────┘
```

---

### Phase 0 — Design Tokens, Typography & The Responsive Floating Shell

**Goal:** Establish the foundational CSS variables, Inter typography, dark mode engine, and the signature floating sidebar with inverted fillet active states and mobile/tablet responsiveness.

#### Step 1 — TOK-001 — Evergreen Material 3 Design Tokens & Theme Engine
- [x] **a.** Inject the full 102 semantic variables into `admin/src/globals.css` with `:root` (Light) and `.dark` (Dark) definitions.
- [x] **b.** Configure Tailwind CSS theme extensions in `admin/tailwind.config.js` or CSS variable mappings (`bg-surface`, `bg-sidebar`, `text-primary`, `text-secondary`, `brand-primary`, `border-outline`).
- [x] **c.** Integrate font **Inter** (weights 400 Regular, 500 Medium, 600 SemiBold, 700 Bold) as the primary font family.
- [x] **d.** Modernize `admin/src/theme/ThemeContext.tsx` to toggle the `.dark` class on `document.documentElement` and persist choice in `localStorage`.
- [x] **e.** Verify contrast ratios according to WCAG 2.2 AA (minimum 4.5:1 for body text, 3:1 for large headers and status badges).

#### Step 2 — SHELL-001 — Floating Sidebar with Inverted Border Radius (Inverse Fillet) & Responsive Drawer
- [x] **a.** Create `admin/src/components/Sidebar.tsx` with floating geometry: width `228px`, height calc `100vh - 64px`, margin `32px`, `border-radius: 32px`, background `#EDECF6` (light) / `#12182E` (dark).
- [x] **b.** Build the brand header (`EVERGREEN COMMERCE ADMIN` / `ESHOP VERSE`) with 18px SemiBold text and small descriptor.
- [x] **c.** Implement the core navigation links:
  1. `Overview` (Icon: Layout Dashboard, `/reports` or `/`)
  2. `Products` (Icon: Tag, `/products`)
  3. `Categories` (Icon: Folder / Grid, `/categories`)
  4. `Orders` (Icon: Shopping Cart, `/orders`)
  5. `Inventory` (Icon: Archive / Package, `/inventory`)
  6. `Settings` (Icon: Settings, `/settings`)
- [x] **d.** Implement the **Inverted Border Radius (Inverse Fillet Curve)** for the active route:
  - The active tab background matches the main canvas background (`#F7F7FC` / `#0B1021`).
  - Top and bottom outer corners smoothly scoop into the main body using `::before` (`border-bottom-right-radius: 28px`) and `::after` (`border-top-right-radius: 28px`) with box-shadow fills.
- [x] **e.** Responsive Behavior: On screens `< 1280px`, sidebar collapses into a slide-over mobile drawer or compact icon bar with hamburger toggle.
- [x] **f.** Add bottom store status pill (`● Store online` in `#B9F1CD` container).

#### Step 3 — SHELL-002 — Top Header Bar & Search Shell
- [x] **a.** Build `admin/src/components/TopBar.tsx`: search bar with rounded-16px container, `⌕` search icon, and placeholder `Search anything...`.
- [x] **b.** Add theme toggle button: rounded-20px pill (`40px` height) with animated `☾` (moon) and `☼` (sun) icons.
- [x] **c.** Add Admin user dropdown: displays avatar / `Admin ▾` with logout action connected to Sanctum session invalidation.

---

### Phase 1 — Authentication & Public Legal Shells

**Goal:** Replicate the high-conversion split-screen Login page, password reset flow, and public legal documentation pages.

#### Step 1 — AUTH-101 — Split-Screen Login Page (`/login`)
- [x] **a.** Layout: 2-column responsive layout.
  - Left column: Signature royal purple card (`#6938D3` background, `border-radius: 24px`, white text) with brand title and headline: *"A calmer way to run your store. Your operations, customers and growth — all in one considered workspace."*
  - Right column: Clean, focused form container with heading *"Welcome back / Sign in to continue to your admin workspace."*
- [x] **b.** Form fields: Email input and Password input styled with `#F3F2FA` (light) / `#1D2644` (dark) background, `1px solid #CAC7D8` border, `16px` border-radius.
- [x] **c.** Controls: "Remember me" checkbox, "Forgot password?" link, and full-width `Sign in` button (`#6938D3`, rounded-16px, hover transitions).
- [x] **d.** Wire form submission to `admin/src/api/auth.ts` with CSRF cookie handling (`GET /admin/auth/csrf`) and clear inline error feedback.

#### Step 2 — AUTH-102 — Reset Password Flow (`/forgot-password`)
- [x] **a.** Centered Bento card (`border-radius: 24px`, `1px solid #CAC7D8`) with top purple badge icon.
- [x] **b.** Email input with instruction *"Enter the email address associated with your admin account. We'll send you a secure reset link."*
- [x] **c.** Primary action `Send reset link` and secondary action `← Back to sign in`.

#### Step 3 — LEGAL-101 — Public Legal Pages (`/privacy` and `/terms`)
- [x] **a.** Restyle `admin/src/pages/LegalPages.tsx` to inherit the new Evergreen typography, container constraints, and clean card surfaces.
- [x] **b.** Ensure pages are accessible publicly without requiring admin authentication (needed for Google OAuth validation).

---

### Phase 2 — Catalog & Product Lifecycle (The Core Engine)

**Goal:** Implement the primary workspace for creating, editing, and listing products with multi-image dropzones, pricing validation, stock orchestration, and robust draft auto-recovery.

#### Step 1 — PROD-101 — Populated Products List (`/products`)
- [x] **a.** Bento Table layout:
  - Header: Breadcrumb `Catalog / Products`, H1 `Products`, subtitle `Manage your catalog and keep product information up to date.`, and `+ Create product` primary button.
  - Search & filter row: keyword search (`q`), category dropdown filter, and status filter (`active`, `inactive`, `archived`).
- [x] **b.** Table columns:
  - `Product`: 48px rounded thumbnail + Title + SKU.
  - `Category`: category badge.
  - `Price`: formatted USD price (`$129.00`).
  - `Inventory`: current quantity with color indicator (Green > 10, Orange 1-10, Red 0).
  - `Status`: rounded-16px badge (`Active` in purple, `Draft` in neutral).
  - `Actions`: quick edit icon, archive/delete action (with confirmation modal).
- [x] **c.** Pagination component: rounded pagination bar matching Figma (`‹ 1 2 3 ›` with page size selector).
- [x] **d.** Empty State: implement exact Figma empty state (*"Your catalog is ready for its first product"* + purple plus icon + `Create your first product` button).

#### Step 2 — PROD-102 — Create Product Form & Orchestration (`/products/new`)
- [x] **a.** Implement the exact 2-column Bento Grid from **Figma Screen 12**:
  - **Left Card 1 — Product information:** Title input (`PRODUCT TITLE`, placeholder `e.g. Ceramic table lamp`) and multi-line Description (`DESCRIPTION`, `140px` height) with auto-draft recovery from `sessionStorage`.
  - **Right Card 1 — Product organization:** Category dropdown (`CATEGORY`, populated from `GET /admin/categories`), Status picker (`Active` / `Draft`). *(Note: `Brand` and `Compare-at Price` are reconciled as client-only/omitted to match Laravel schema).*
  - **Left Card 2 — Media Dropzone:** Multi-image upload area with rounded cards (`185px` height), `+ Add image` icon, drag-and-drop file staging, thumbnail preview, and delete capability. Validates max 8 images (`MAX_IMAGES`), max 5MB size, allowed MIME types (`jpg, jpeg, png, webp, gif`), and advises 1:1 aspect ratio for Android compatibility. Form field named `image`.
  - **Right Card 2 — Pricing & inventory:** Price input (`PRICE`, validated strictly against `^\d{1,9}\.\d{2}$`), SKU input (`SKU`, with inline error mapping for `409 SKU_TAKEN`), and Initial Stock Quantity (`QUANTITY`).
- [x] **b.** Auto-draft recovery and submission pipeline:
  1. Auto-save in `sessionStorage` during input and restore on page load.
  2. Call `POST /admin/products` with name, description, price, sku, categoryId, status.
  3. Image file management through `uploadAdminProductImage` / `deleteAdminProductImage`.
- [x] **c.** Error Handling & Rollback: Inline validation errors, 409 SKU taken mapping, and unsaved changes guard dialog.

#### Step 3 — PROD-103 — Product Details Page (`/products/:id`)
- [x] **a.** Replicate **Figma Screen 13**:
  - Top action bar: Product title H1, status badge (`ACTIVE`), and `Edit product` button.
  - Left Bento Card: Large primary image preview + gallery strip.
  - Right Bento Card: Product overview (SKU, Category, Large Price `$129.00`, `In stock` badge).
  - Right Bottom Bento Card: Inventory summary (Total available units, low stock threshold).
- [x] **b.** Edit shortcut: clicking `Edit product` routes to `/products/:id/edit` with prefilled values.

#### Step 4 — PROD-104 — Product Action Feedback & Modals
- [x] **a.** Replicate the Figma **Success State**:
  - Card with center purple checkmark icon.
  - Heading: *"Product created successfully"*.
  - Subtitle: *"Your new product is now saved in the catalog and ready for review before it appears in your storefront."*.
  - Action buttons: `View product` (primary) and `Add another` (secondary outline).
  - Footer: `Product ID: EVG-xxxx · Saved just now`.
- [x] **b.** Destructive action modal: `ConfirmDialog` with confirmation prompt before archiving a product. If a permanent delete (`DELETE`) is attempted on a product with orders, catch `409 PRODUCT_HAS_ORDERS` and prompt the admin: *"This product belongs to existing customer orders and cannot be permanently deleted. Would you like to archive it instead?"* with one-click archive action.

---

### Phase 3 — Category Management & Inventory Matrix

**Goal:** Enable full category lifecycle (vital for Android catalog navigation) and provide a high-efficiency table for batch inventory restocking.

#### Step 1 — CAT-101 — Category Management (`/categories`)
- [x] **a.** Category List: Bento Table of categories with category name, sort order, product count, and status badge (`Active` / `Archived`).
- [x] **b.** Category Modal: create or edit category dialog (`name`, `sortOrder`).
- [x] **c.** Lifecycle actions: archive (`POST /admin/categories/{id}/archive`) and restore (`POST /admin/categories/{id}/restore`).
- [x] **d.** Android Compatibility: Ensure category names align with clean single-word titles ("T-Shirts", "Shirts", "Pants", "Dresses", "Jackets", "Activewear", "Shoes", "Accessories", "Leather", "Bags") with quick chip presets in the creation modal.

#### Step 2 — INV-101 — Quick Inventory & Low-Stock Alerts (`/inventory`)
- [x] **a.** Quick Restock Table: lists all catalog items with SKU, product name, current stock, and stock status.
- [x] **b.** Inline Quick Edit: allow clicking the quantity cell, typing the new quantity, and saving automatically via `PATCH /admin/inventory/{id}` with optimistic UI update.
- [x] **c.** Low Stock Filter: quick toggle to show only items with `quantity <= 5` or `inStock === false`.

---

### Phase 4 — Customer Orders & Fulfillment Workflow

**Goal:** Provide an intuitive order processing workflow for reviewing and fulfilling customer orders placed via the Android app.

#### Step 1 — ORD-101 — Orders Table & Filter Tabs (`/orders`)
- [ ] **a.** Status Tabs: `All orders`, `Pending payment`, `Confirmed`, `Processing`, `Shipped`, `Delivered`, `Cancelled`.
- [ ] **b.** Orders Table:
  - Columns: Order ID (e.g. `#EV-1048`), Customer name & email, Date, Total amount, Payment status badge, Order status badge, and Details button.
- [ ] **c.** Status Badges:
  - `Pending payment`: Light purple `#EBDDFF` with dark violet text.
  - `Confirmed` / `Processing`: Blue `#D1E9FF` with deep cyan text.
  - `Shipped`: Soft orange `#FFEDD5` with dark amber text.
  - `Delivered`: Green `#B9F1CD` with dark forest green text.
  - `Cancelled`: Rose `#FFE4E6` with dark red text.
- [ ] **d.** Error State: Replicate exact Figma screen *"We couldn't load your orders / Something went wrong while retrieving order data. Check your connection and try again."* with purple `Try again` button and error reference code (`ORD-LOAD-042`).

#### Step 2 — ORD-102 — Order Details & State Machine Transitions (`/orders/:id`)
- [ ] **a.** Detailed Bento Order View:
  - Customer contact info & formatted shipping address snapshot.
  - Items list: product thumbnail, name, unit price, quantity, and line total.
  - Simulated payment details & transaction ID.
  - Order audit timeline showing timestamped events.
- [ ] **b.** Dynamic State Transitions:
  - Only show action buttons matching `order.allowedTransitions` (`processing`, `shipped`, `delivered`, `cancelled`).
  - Calls `PATCH /admin/orders/{id}/status` with `{ status }` and refreshes timeline without full page reload.

---

### Phase 5 — Overview Command Center (Reports Integration)

**Goal:** Build a 3-second overview dashboard powered by the existing `GET /admin/reports/sales` endpoint.

#### Step 1 — DASH-101 — Overview Dashboard (`/` or `/reports`)
- [ ] **a.** KPI Bento Cards:
  1. `Gross Sales / Revenue`: total sales formatted as currency.
  2. `Total Orders`: count of placed orders.
  3. `Active Catalog`: total active products count.
  4. `Low Stock Items`: count of inventory items needing immediate attention.
- [ ] **b.** Quick Actions Bar: `+ Create product` button and `View pending orders` shortcut.
- [ ] **c.** Recent Orders Matrix: latest 5 customer orders with status badges and quick view links.

---

### Phase 6 — Streamlined Store Settings & Profile

**Goal:** Provide essential store configuration and account security.

#### Step 1 — SET-101 — Store Settings (`/settings`)
- [ ] **a.** Store Profile: Store name (`Evergreen Store` / `EShop Verse`), support email, contact phone, store currency display.
- [ ] **b.** Regional Preferences: Date format (`MM/DD/YYYY`), Timezone.
- [ ] **c.** Admin Account Security: change password form (Current password, New password, Confirm password).

---

### Phase 7 — Quality Assurance, Testing & Build Verification

**Goal:** Ensure 100% test passing rate, zero accessibility violations, and clean production bundles.

#### Step 1 — QA-001 — Unit & Component Test Suite
- [ ] **a.** Update existing test mocks in `admin/src/test/` to reflect new component props and layout structures.
- [ ] **b.** Verify all tests pass via `npm --prefix admin test` (maintain 100% passing rate across all test suites).
- [ ] **c.** Verify TypeScript type-checking passes with zero errors: `npm --prefix admin run typecheck` (or `tsc --noEmit`).
- [ ] **d.** Verify linting passes: `npm --prefix admin run lint`.

#### Step 2 — QA-002 — Production Build & Host Packaging
- [ ] **a.** Run `npm --prefix admin run build` to produce the optimized production bundle in `admin/dist/`.
- [ ] **b.** Test local preview via `npm --prefix admin run preview`.
- [ ] **c.** Execute `deploy/build-release.ps1` or `deploy/build-release.sh` to package the admin bundle and ensure seamless integration with the Laravel backend.

---

## 3. Implementation Verification Checklist

| Phase | Milestone | Deliverable | Status |
| :--- | :--- | :--- | :--- |
| **Phase 0** | Design Tokens & Shell | 102 tokens, Inter font, Floating Sidebar with Inverted Fillet & Responsive Drawer | `Completed` |
| **Phase 1** | Auth & Legal | Redesigned Login, Forgot Password, Legal Pages | `Completed` |
| **Phase 2** | Catalog Engine | Populated Products Table, Create Product Orchestration, Details, Success Modal | `Planned` |
| **Phase 3** | Stock & Categories | Quick Restock Inventory Matrix, Category CRUD & Android Icon Alignment | `Planned` |
| **Phase 4** | Orders Workflow | Order Table, State Machine Transition Buttons, Details, Error State | `Planned` |
| **Phase 5** | Overview & Reports | KPI Dashboard powered by `GET /admin/reports/sales`, Recent Orders | `Planned` |
| **Phase 6** | Store Settings | Store Info, Regional Preferences, Password Change | `Planned` |
| **Phase 7** | QA & Packaging | Vitest Green, Typecheck Clean, Bundle Build Verified | `Planned` |
