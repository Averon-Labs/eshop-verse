# Design System

## Purpose

This document defines the design system for EShop Verse's Android customer application. It establishes a consistent visual language using Material 3 (Material You) principles.

The first release is English-only and left-to-right. Store all visible text in string resources so future localization does not require layout rewrites.

The tokens below are the first-release baseline. Keep them in Android resources and update them only through a reviewed design change.

---

## Color System

**Status: DECIDED — initial light theme**

Use a stable brand palette with Material 3 semantic roles:

| Role | Initial value | On-color |
|------|---------------|----------|
| Primary | `#3347A8` | `#FFFFFF` |
| Secondary | `#455A64` | `#FFFFFF` |
| Tertiary | `#00695C` | `#FFFFFF` |
| Error | `#B3261E` | `#FFFFFF` |
| Surface | `#FAFAFC` | `#1B1B1F` |

Dark theme support is deferred. Verify text contrast for actual component states; do not infer that a palette token alone guarantees accessible contrast.

---

## Typography

**Status: DECIDED**

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

Font family: Android system default (Roboto on supported Android versions); keep text in English string resources.

---

## Spacing

**Status: DECIDED**

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

**Status: DECIDED**

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

**Status: DECIDED**

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
| Outlined | Secondary actions |
| Text | Tertiary actions (View All, Cancel) |
| FAB | Primary screen action |
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
- Product badge (new, out of stock)
- Quantity selector

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
2. Categories / Search
3. Cart
4. Profile / Account

---

## Accessibility

- Minimum touch target: 48dp × 48dp
- Minimum color contrast ratio: 4.5:1 (text), 3:1 (large text)
- Content descriptions for all interactive elements
- Support for TalkBack screen reader
- Support for font scaling
- Keyboard navigation support where applicable
- Focus indicators for interactive elements
