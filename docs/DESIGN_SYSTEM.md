# Design System

## Purpose

This document defines the shared visual language for the Android customer app and React admin dashboard. Android uses XML Views and Material 3; the web dashboard uses its own responsive web patterns with the same brand tokens. Page-by-page composition and behavior are in [`SCREEN_SPECIFICATIONS.md`](SCREEN_SPECIFICATIONS.md).

The first release is English-only, en-US, and USD. Store customer-facing Android copy in string resources and web copy in the app's central message/constants layer so the UI can be localized later without layout rewrites.

The visual direction is based on the owner's supplied e-commerce mobile/dashboard reference: bright white surfaces, a soft light-gray canvas, coral highlights, near-black text, generous whitespace, rounded cards, product-forward imagery, and Lato typography. The reference supplies visual style only. It does not define this product's page inventory, content, or behavior; those remain governed by `PRODUCT.md`, the API contract, and `ROADMAP.md`. See [ADR-002](decisions/ADR-002-shared-visual-direction.md).

Keep the tokens below synchronized across Android resources and web CSS variables. Change them centrally through a reviewed design update; never introduce unrelated per-screen palettes.

## Visual Consistency Rules

- This is the single visual language for every Android and admin screen. New screens extend the patterns and tokens here and in `SCREEN_SPECIFICATIONS.md`; they do not introduce an unrelated screen-specific design language.
- Apply a reference layout cue only to an existing project screen with a matching role. For other screens, use shared tokens and components while preserving the content hierarchy and flow defined by the product and roadmap. Do not add pages, controls, data, or behavior just because they appear in the reference.
- Build Android UI with XML Views and Material 3 components. Use the shared app theme and Android resources for colors, type, dimensions, shapes, and component styles. The first release follows the light visual reference; do not let device dynamic color replace the brand palette.
- Build admin UI with semantic, responsive React web patterns and the same brand tokens. Use shared CSS variables/design tokens for color, type, spacing, shape, elevation, and focus styles; do not imitate Android's bottom navigation in the desktop dashboard.
- Do not hardcode color, spacing, corner radius, text appearance, or elevation in individual screens. A deliberate token change updates this document and the shared Android/web resources together.
- Use Material 3 components and shared patterns for Android app bars, bottom navigation, buttons, fields, cards, dialogs, snackbars, and progress. Use consistent web navigation, buttons, fields, tables, cards, dialogs, and status badges in the dashboard.
- Every data-driven screen defines loading, content, empty, error/retry, and success feedback as applicable. Reuse consistent layout, wording, icon treatment, and action placement across the app or dashboard.
- Prefer clear hierarchy, restrained decoration, readable typography, consistent alignment and whitespace, and purposeful product imagery. Avoid charts or decoration that competes with content or creates inconsistent density.
- Support small and large screens, system font scaling, accessible contrast, minimum 48dp Android targets / 44 CSS px web targets, semantic labels, TalkBack, keyboard navigation, visible focus, and usable error text.
- Before implementing a screen, inspect existing screens and both design documents. Extend a shared component or pattern when possible. Introduce a new reusable pattern only for a real product need and document it here.

### XML Implementation Checklist

For each new or materially changed screen, verify during implementation/review that:

1. The root and child views use the common Material 3 app theme and shared styles.
2. All user-visible strings come from string resources; colors and dimensions come from shared resources.
3. Material 3 components are used for standard interactions instead of custom lookalikes.
4. Screen structure, spacing, typography, and state handling match existing screens and this system.
5. Touch targets, contrast, content descriptions, font scaling, and keyboard/focus behavior are addressed.

---

## Color System

**Status: ACCEPTED — light coral-and-neutral brand palette**

| Token | Value | Use |
|-------|-------|-----|
| Brand coral | `#F7767E` | Primary filled actions, selected emphasis, small decorative accents |
| Brand coral strong | `#B92F3D` | Text/icons on light surfaces and active web navigation |
| Brand coral tint | `#FFF0F1` | Selected rows, soft badges, subtle highlighted surfaces |
| Canvas | `#F5F6F7` | App/page background |
| Surface | `#FFFFFF` | Cards, sheets, fields, sidebar, dialogs |
| Ink | `#161616` | Primary text and icons; foreground on bright coral actions |
| Text secondary | `#777777` | Supporting text and metadata |
| Neutral dark | `#505050` | Secondary controls and strong dividers when needed |
| Outline | `#E7E8EA` | Field/card borders and separators |
| Success | `#256B4B` | Completed/success state |
| Warning | `#8A5300` | Pending/attention state |
| Error | `#B3261E` | Invalid, failed, destructive state |

Bright coral is not used as small text on white. Put `#161616` on `#F7767E` filled actions; use `#B92F3D` for text or icons on white. Confirm actual combinations meet WCAG AA: 4.5:1 for normal text and 3:1 for large text and meaningful non-text indicators. Product imagery may contain its own colors; do not add unrelated per-page accent colors. Dark mode and user-selected dynamic palettes are deferred; first-release screens use the stable light palette.

---

## Typography

**Status: ACCEPTED**

Use Lato to match the supplied visual direction, with Android/web fallback to the system sans-serif. Bundle licensed Lato font assets locally when implementation begins and retain the SIL Open Font License notice. Use the same weight hierarchy across Android and web:

| Role | Android size/weight | Web size/weight | Usage |
|------|---------------------|-----------------|-------|
| Large title | 28sp / 700 | 28px / 700 | Optional prominent heading when the existing screen content calls for it |
| Page title | 24sp / 700 | 24px / 700 | Screen title |
| Section title | 18sp / 700 | 18px / 700 | Content group heading |
| Component title | 16sp / 600 | 16px / 600 | Product/order/card title |
| Body | 14sp / 400 | 14px / 400 | Main content and forms |
| Supporting | 12sp / 400 | 12px / 400 | Metadata and helper copy |
| Action label | 14sp / 700 | 14px / 600 | Buttons, tabs, navigation |

Do not use ultra-light weights for small text. Allow font scaling; let long English content wrap rather than clip or shrink below the role size.

---

## Spacing

**Status: DECIDED**

Use a 4-unit base across Android dp and web CSS px; the numeric values in this table map directly to dp on Android and px on web:

| Token | Value |
|-------|-------|
| xs | 4dp |
| sm | 8dp |
| md-sm | 12dp |
| md | 16dp |
| lg | 24dp |
| xl | 32dp |
| xxl | 40dp |
| xxxl | 48dp |

Consistent spacing should be applied to padding, margins, and gaps.

---

## Shapes

**Status: DECIDED**

Following Material 3 shape scale:

| Shape | Corner Radius | Usage |
|-------|---------------|-------|
| Extra small | 8dp / px | Chips, fields, compact buttons |
| Small | 12dp / px | Product and data cards |
| Medium | 16dp / px | Large cards, forms, dialogs |
| Large | 20dp / px | Large panels only when required by existing screen content |
| Pill | 999dp / px | Chips and fully rounded icon actions |

---

## Elevation

**Status: DECIDED**

Use subtle separation rather than heavy shadows:

| Level | Usage |
|-------|-------|
| Level 0 | Canvas and flat lists |
| Level 1 | Cards and top bars |
| Level 2 | Menus, sheets, sticky actions |
| Level 3 | Dialogs and modal overlays |

---

## Component Specifications

### Buttons

| Type | Usage |
|------|-------|
| Filled | Primary actions (Add to Cart, Place Order) |
| Outlined | Secondary actions |
| Text | Tertiary actions (View All, Cancel) |
| Icon | Toolbar and utility actions |

### Inputs

| Type | Usage |
|------|-------|
| Outlined Text Field | Forms (login, registration, search) |
| Filled Text Field | Alternative style where appropriate |
| Dropdown / Exposed Menu | Category selection, sorting |
| Quantity Selector | Cart item quantity |

### Cards

| Type | Usage |
|------|-------|
| Product Card | Product grid/list items |
| Order Card | Order history items |
| Category Card | Category browsing |

### Product Components

- Product image carousel
- Price display in USD
- Add to cart button
- Availability badge only when the API exposes that state
- Quantity selector

### Web Dashboard Components

| Component | Shared behavior |
|-----------|-----------------|
| Sidebar / mobile navigation | Persistent active item; collapses to a drawer on narrow screens |
| Data table | Clear column headings, aligned values, row actions, keyboard-focusable controls; becomes stacked cards on narrow screens |
| Search and filters | Persistent visible labels, removable filter chips, clear/reset action when filters are active |
| Status badge | Text label plus semantic color; never color alone |
| Form section | Consistent label, helper/error text, field spacing, and save/cancel placement |
| Confirmation dialog | Names the target and consequence; primary/secondary actions are consistent |

---

## State Patterns

### Loading States

| Pattern | Usage |
|---------|-------|
| Skeleton screens | Initial content loading |
| Circular progress | Action in progress |
| Linear progress | Page-level loading |
| Shimmer effect | Not required; use static skeletons in the first release |

### Empty States

| Screen | Message |
|--------|---------|
| Empty cart | Illustration + "Your cart is empty" + CTA |
| Empty orders | Illustration + "No orders yet" + CTA |
| No search results | Illustration + "No results found" + suggestions |

### Error States

| Type | Handling |
|------|----------|
| Network error | Retry button + offline message |
| Server error | Generic error message + retry |
| Validation error | Inline field-level errors |
| Not found | 404-style message |
| Session expired | Redirect to login |

---

## Navigation

**Status: DECIDED**

- Bottom Navigation Bar with four primary destinations
- Toolbar with contextual actions
- Back navigation following Android conventions
- Deep links are deferred from the first release

Bottom navigation items:
1. Home
2. Explore
3. Cart
4. Profile / Account

Do not add a wishlist/favorites destination or heart action in the first release. Wishlists are deferred in `PRODUCT.md`.

### Admin Dashboard Navigation

- Desktop sidebar destinations: Products, Categories, Inventory, Orders.
- Account menu provides the signed-in admin identity and Sign out action.
- Do not add customer administration, analytics, notifications, transaction history, or CMS destinations in the first release; those are outside the product scope.

---

## Responsive Layout

### Android

- Design and review the primary portrait flow at 360dp width; support narrow 320dp devices without horizontal scrolling.
- Use 16dp horizontal screen gutters, 12dp grid gaps, and a two-column product grid when each card remains at least 140dp wide; collapse to one column only when required by available width.
- Keep the four-destination bottom navigation and system insets clear of scrollable content and sticky checkout actions.
- On tablets/landscape, allow wider content and additional grid columns while keeping text and card widths readable.

### Admin Web

- Wide desktop (at least 1200 CSS px): 248px sidebar, top bar, and a centered content area capped near 1440px.
- Tablet (768–1199px): compact/collapsible sidebar and reduced table columns where secondary details move into row detail.
- Narrow screens (below 768px): sidebar becomes a drawer; multi-column forms become one column; tables reflow to labeled cards without hiding actions or status.
- Do not make small numeric or order status text depend on hover-only disclosure.

---

## Accessibility

- Minimum touch target: 48dp × 48dp
- Minimum web interactive target: 44 CSS px × 44 CSS px
- Minimum color contrast ratio: 4.5:1 (text), 3:1 (large text)
- Content descriptions for all interactive elements
- Support for TalkBack screen reader
- Support for font scaling
- Keyboard navigation support where applicable
- Focus indicators for interactive elements
