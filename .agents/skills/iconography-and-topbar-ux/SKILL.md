---
name: iconography-and-topbar-ux
description: >
  Production-grade mobile UI/UX engineering guidelines for Vector Iconography, Optical Padding,
  Material 3 Grid Alignment, Top App Bar Information Architecture, Fitts's Law Anchor Hierarchy,
  and Day/Night Theme Toggle Placement across Android (Java/XML) and responsive mobile interfaces.
---

# Mobile Iconography & Top Bar UX Architecture Standards

This skill defines the engineering and design system rules for iconography and top application bar architecture in EShop Verse. It guarantees optical balance, prevents visual weight distortion (ink-blobbing), establishes consistent stroke semantics across categories, and enforces disciplined information hierarchy in screen headers according to Fitts's Law and Material Design 3 guidelines.

---

## 1. Vector Iconography Engineering Rules

### 1.1 Canvas Dimensions & Optical Safe Zones (Keyline Grid)
- **Viewport Dimension:** All application icons must be authored on a strict `24dp x 24dp` viewport (`viewportWidth="24"` and `viewportHeight="24"`).
- **Mandatory Optical Padding (2dp Safe Margin):**
  - No vector path may bleed directly to `x=0, y=0` or `x=24, y=24`.
  - The live active drawing area must reside within `[2, 2]` to `[22, 22]` (`20dp x 20dp` box).
  - Leaving a minimum 2dp padding ensures that icons nested inside circular containers (e.g. `56dp` category mood circles) or compact interactive chips (`32dp` height) maintain proper breathing room and do not appear cramped or oversized.

### 1.2 State Semantics: Outlined vs. Filled
- **Default / Unselected State (Outlined):**
  - Category chips, list items, and resting navigation targets must use an **Outlined (Linear)** style with a uniform stroke weight of `1.5dp` to `2.0dp`.
  - Outlined geometry prevents heavy visual weight ("ink blobs"), reduces visual clutter, and delivers an airy, premium luxury/fashion aesthetic.
- **Selected / Active State (Filled / Tinted):**
  - Solid fills are strictly reserved for active tabs, selected states, or filled counters (e.g., favorite toggled on `ic_heart_filled`).
  - Do not use solid black silhouettes for resting category icons.

### 1.3 Universal Tinting & Dark Mode Scalability
- **Neutral White Base (`@android:color/white`):**
  - In Android VectorDrawables, construct paths using `android:fillColor="@android:color/white"` (or transparent fill with uniform stroke) so that runtime color filters (`app:tint`, `chip.setChipIconTintResource`) apply uniformly across the entire rasterized path.
- **Never Hardcode Solid Color Values:**
  - Avoid `#FF000000` or raw hex codes inside vector assets. Use semantic color tokens (`?attr/colorControlNormal`, `@color/color_botanical_green`, or dynamic tinting).

### 1.4 E-Commerce Category Icon Metaphors
| Category | Recommended Metaphor | Anti-Pattern to Avoid |
| :--- | :--- | :--- |
| **All** | 2x2 rounded square grid (`grid_view`) | Random mosaic or unaligned blocks |
| **Accessories** | Minimalist luxury analog watch (dial with hands + strap) | Boxy sunglasses or generic jewelry box |
| **T-Shirts** | Casual crewneck tee with short sleeves and relaxed drape | Formal collared shirt or flat trapezoid |
| **Shirts & Tops** | Button-down shirt with collar lapels and vertical buttons | Duplicate crewneck tee |
| **Pants & Jeans** | Tailored trousers/denim with waistband and straight legs | Overly narrow or disconnected legs |
| **Dresses** | Symmetrical A-line dress with defined waist and flared skirt | Asymmetrical cocktail silhouette |
| **Jackets & Coats** | Tailored blazer / outerwear with minimal lapels and zipper line | Dense 3-parallel line zipper/lapel clutter |
| **Shoes** | Sleek low-top athletic sneaker with distinct sole | Heavy solid work boot |
| **Bags** | Structured tote handbag with curved overhead handle | Complex multi-pocket luggage |
| **Activewear** | Athletic performance top / racerback gear | Abstract fitness stick-figure |
| **Leather & Suede** | Classic leather hide / pelt emblem | Literal animal shapes |

---

## 2. Top App Bar (Header) Information Architecture

### 2.1 Fitts's Law & The Primary Anchor Principle
- **The Outermost Edge is the Primary Anchor:** In a Left-to-Right (LTR) interface, the top-right corner of the mobile viewport is the most ergonomically accessible focal point.
- **User Identity Takes Precedence:** The user's account identity (`btn_account_avatar` / user initials / profile picture) represents personal state and must occupy the **outermost right edge** of the top header.
- **Secondary Utilities Precede the Anchor:** Any secondary utility (such as `btn_theme_toggle`) must sit to the **inside (left)** of the account avatar, with standard spacing (`8dp` / `@dimen/spacing_sm`).
- **Hierarchy Rule:**
  ```text
  [ Brand Logo / Title ] (weight=1) ------------ [ Utility: Theme Toggle ] [ Anchor: User Avatar ]
  ```

### 2.2 Navigation Redundancy & Screen Real Estate
- **Bottom Navigation Alignment:** When a screen includes a persistent bottom navigation bar containing an `Account` tab, a top-bar avatar that simply routes to the same `Account` destination is functionally redundant.
- **Header Optimization for High-Frequency Actions:**
  - In mature e-commerce apps, header real estate is reserved for high-value user conversion drivers: **Search**, **Wishlist (Favorites)**, and **Notifications**.
  - System-level configuration toggles (such as Dark/Light mode) should reside within **Account / Settings** rather than cluttering the daily shopping storefront header.
  - If retained on the Home header for quick-demo convenience, the theme toggle must remain visually subordinate to the user avatar.
