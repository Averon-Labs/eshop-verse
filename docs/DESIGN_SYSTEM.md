# Design System

## Purpose

This document defines the design system for EShop Verse's Android customer application. It establishes a consistent visual language using Material 3 (Material You) principles.

> **Note:** Specific values (colors, exact dimensions) are placeholders and require design approval before finalization.

---

## Color System

**Status: OPEN**

The color system will follow Material 3's dynamic color scheme structure:

- **Primary** — Brand primary color for key UI elements
- **Secondary** — Supporting color for less prominent elements
- **Tertiary** — Accent color for contrast and emphasis
- **Error** — Error states and destructive actions
- **Surface** — Background and container colors
- **On-Primary / On-Secondary / On-Surface** — Text/icon colors on respective surfaces

Dark theme support: **PROPOSED** — planned but not required for initial release.

---

## Typography

**Status: PROPOSED**

Following Material 3 type scale:

| Role | Usage |
|------|-------|
| Display Large | Hero sections, splash |
| Display Medium | Page headers |
| Headline Large | Section headers |
| Headline Medium | Card titles |
| Title Large | Toolbar titles |
| Title Medium | List item titles |
| Body Large | Primary body text |
| Body Medium | Secondary body text |
| Label Large | Buttons, tabs |
| Label Medium | Captions, metadata |

Font family: **OPEN** — System default or custom font to be decided.

---

## Spacing

**Status: PROPOSED**

Using a 4dp base unit:

| Token | Value |
|-------|-------|
| xs | 4dp |
| sm | 8dp |
| md | 16dp |
| lg | 24dp |
| xl | 32dp |
| xxl | 48dp |

Consistent spacing should be applied to padding, margins, and gaps.

---

## Shapes

**Status: PROPOSED**

Following Material 3 shape scale:

| Shape | Corner Radius | Usage |
|-------|---------------|-------|
| Extra Small | 4dp | Chips, small components |
| Small | 8dp | Buttons, text fields |
| Medium | 12dp | Cards, dialogs |
| Large | 16dp | Sheets, large containers |
| Extra Large | 28dp | FABs, navigation bars |

---

## Elevation

**Status: PROPOSED**

Material 3 tonal elevation levels:

| Level | Usage |
|-------|-------|
| Level 0 | Flat surfaces |
| Level 1 | Cards, app bars |
| Level 2 | Floating elements |
| Level 3 | Dialogs, modals |
| Level 4 | Navigation drawers |
| Level 5 | Highest elevation |

---

## Component Specifications

### Buttons

| Type | Usage |
|------|-------|
| Filled | Primary actions (Add to Cart, Place Order) |
| Outlined | Secondary actions (Add to Wishlist) |
| Text | Tertiary actions (View All, Cancel) |
| FAB | Primary screen action |
| Icon | Toolbar actions, favorites |

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
| Review Card | Product review items |
| Category Card | Category browsing |

### Product Components

- Product image carousel
- Price display (with sale price support)
- Rating stars display
- Add to cart button
- Wishlist toggle
- Product badge (new, sale, out of stock)
- Quantity selector

---

## State Patterns

### Loading States

| Pattern | Usage |
|---------|-------|
| Skeleton screens | Initial content loading |
| Circular progress | Action in progress |
| Linear progress | Page-level loading |
| Shimmer effect | PROPOSED — Content placeholder |

### Empty States

| Screen | Message |
|--------|---------|
| Empty cart | Illustration + "Your cart is empty" + CTA |
| Empty wishlist | Illustration + "No saved items" + CTA |
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

**Status: PROPOSED**

- Bottom Navigation Bar with 4-5 primary destinations
- Toolbar with contextual actions
- Back navigation following Android conventions
- Deep linking support planned

Proposed bottom navigation items:
1. Home
2. Categories / Search
3. Cart
4. Wishlist
5. Profile / Account

---

## Accessibility

- Minimum touch target: 48dp × 48dp
- Minimum color contrast ratio: 4.5:1 (text), 3:1 (large text)
- Content descriptions for all interactive elements
- Support for TalkBack screen reader
- Support for font scaling
- Keyboard navigation support where applicable
- Focus indicators for interactive elements
