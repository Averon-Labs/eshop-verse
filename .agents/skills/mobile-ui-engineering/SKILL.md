---
name: mobile-ui-engineering
description: >
  Master engineering and design system standard for mobile UI/UX: Vector Iconography Keyline Grid (24x24dp, 2dp padding),
  Top App Bar UX Architecture & Fitts's Law Anchors, and Instagram-Grade Media & Avatar Pipeline (Optimistic UI,
  Client-Side Downscaling, Zero-Redownload, and Semantic Destructive Actions).
---

# Mobile UI/UX Engineering & Interaction Standards

This skill is the single reference standard for mobile UI/UX engineering, asset design, and interaction pipelines in EShop Verse. It guarantees optical balance, prevents visual weight distortion (ink-blobbing), enforces disciplined information hierarchy in screen headers, and implements consumer-grade media upload pipelines matching Instagram, Telegram, and WhatsApp.

---

## 1. Vector Iconography & Keyline Grid Engineering

### 1.1 Canvas Dimensions & Optical Safe Zones (Keyline Grid)
- **Viewport Dimension:** All application vector icons must be authored on a strict `24dp x 24dp` viewport (`viewportWidth="24"` and `viewportHeight="24"`).
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
  - In Android VectorDrawables, construct paths using `android:fillColor="@android:color/white"` or `android:strokeColor="@android:color/white"` so that runtime color filters (`app:tint`, `chip.setChipIconTintResource`, `ImageView.setColorFilter`) apply uniformly across the entire rasterized path.
- **Never Hardcode Solid Color Values:**
  - Avoid `#FF000000`, `@color/color_botanical_green`, or raw hex codes inside vector assets. Use semantic color tokens (`?attr/colorControlNormal`, `@color/color_botanical_green`, or dynamic tinting).

### 1.4 E-Commerce Category Icon Metaphors
| Category | Recommended Metaphor | Anti-Pattern to Avoid |
| :--- | :--- | :--- |
| **All** | 2x2 rounded square grid (`grid_view`) | Random mosaic or unaligned blocks |
| **Accessories** | Minimalist luxury analog watch (dial with 10:10 hands + strap + crown) | Boxy sunglasses or generic jewelry box |
| **T-Shirts** | Casual crewneck tee with short sleeves and relaxed drape | Formal collared shirt or flat trapezoid |
| **Shirts & Tops** | Button-down shirt with collar lapels and vertical buttons | Duplicate crewneck tee |
| **Pants & Jeans** | Tailored trousers/denim with waistband and straight legs | Overly narrow or disconnected legs |
| **Dresses** | Symmetrical A-line dress with defined waist and flared skirt | Asymmetrical cocktail silhouette |
| **Jackets & Coats** | Tailored outerwear with open V-lapels and single zipper line | Dense 3-parallel line zipper/lapel clutter |
| **Shoes** | Sleek low-top athletic sneaker with distinct sole | Heavy solid work boot |
| **Bags** | Structured tote handbag with curved overhead handle | Complex multi-pocket luggage |
| **Activewear** | Athletic performance top / racerback gear | Abstract fitness stick-figure |
| **Leather & Suede** | Classic leather hide / pelt emblem | Literal animal shapes |
| **Audio** | Studio over-ear headphones with arched headband | Solid bulky headphones |
| **Photography** | Minimalist rangefinder camera with lens & flash dot | 6-blade cluttered iris aperture |
| **Wearables** | Modern curved smartwatch with activity ring & sport bands | Solid black rectangle watch |
| **Workspace** | Sleek desktop monitor with slim stand & desk line | Chunky stacked cubicle boxes |
| **Electronics** | Slim modern laptop with trackpad cutout | Vague generic circuit box |

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

---

## 3. Instagram-Grade Media & Avatar Pipeline

Modern consumer applications (Instagram, Telegram, WhatsApp, Twitter/X) never subject users to blocking loading spinners or multi-second waits when updating profile media. All media upload workflows must adhere to the following 5 engineering principles:

### 3.1 Optimistic UI & Zero-Latency Perception (0ms Lag)
- **Immediate Local Rendering:** The millisecond the user selects an image from the gallery (via `PickVisualMedia`) or captures a photo from the camera (`TakePicturePreview`), the application must **immediately render** the local `Uri` or `Bitmap` into the target `ImageView` (e.g. using `ImageLoaderHelper.loadImage(imageView, uri.toString())`).
- **Never Block the User Interface:** Do not display a full-screen blocking dialog or obscure the avatar with an opaque progress spinner. The user must see their newly selected photo instantly.

### 3.2 Client-Side Downscaling & Compression (Pre-Flight Optimization)
- **The Multi-Megapixel Problem:** Modern phone cameras produce 12MP to 48MP photos with raw file sizes between 3MB and 10MB. Transmitting a 5MB payload for an avatar displayed at `80dp` to `120dp` on screen is an anti-pattern that causes network timeouts and consumes excessive bandwidth.
- **Mandatory Pre-Upload Compression Pipeline:**
  1. **Memory-Safe Bounds Decoding:** Decode image dimensions using `BitmapFactory.Options.inJustDecodeBounds = true` without allocating pixel heap.
  2. **Power-of-Two Sub-Sampling:** Compute an optimal `inSampleSize` to scale the image down so its maximum dimension is at or near `512px`.
  3. **Precision Downscaling:** Scale precisely to `512x512px` (the optimal mobile avatar resolution).
  4. **JPEG Quality Compression:** Compress the resulting bitmap to JPEG with quality factor `85%`.
  5. **Payload Reduction:** This pipeline reduces payload size from **3–10 MB down to 40–90 KB (98% reduction)**, enabling uploads to complete in under 300ms even over cellular or VPN connections.

### 3.3 Zero Re-Download & Local Cache Handshake
- **Never Re-Download the User's Own Photo:** When the backend acknowledges the upload with `200 OK` and returns the remote image URL, do not trigger a fresh network download for the image that the user just uploaded from their local storage.
- The image loader (Glide) should seed its memory cache with the local resource, or keep the rendered local bitmap active until the remote image is naturally accessed in future sessions.

### 3.4 Non-Blocking Background Network Synchronization & Graceful Reversion
- **Background Execution:** All image reading, downscaling, compression, and network I/O must execute off the main thread (using an `ExecutorService` or coroutine).
- **Subtle Progress Feedback:** While uploading, keep the newly selected photo visible and display a small, non-intrusive progress indicator (e.g. 20dp spinner or subtle overlay).
- **Graceful Error Reversion:** If the upload fails (e.g., network disconnect or server 500 error):
  1. Hide the busy indicator.
  2. Revert the avatar `ImageView` to the user's previously verified state.
  3. Surface an anchored, non-intrusive Snackbar informing the user of the error.

### 3.5 Semantic Destructive Actions & Contextual Visibility
- **Material 3 Destructive Color:** Destructive options (such as "Remove Current Photo" / "Delete Avatar") must use semantic error styling (`@color/status_error` or `?attr/colorError`), providing a minimum 4.5:1 contrast ratio against the background. Never use washed-out pastel or low-contrast terracotta tints that mimic disabled states.
- **Contextual Visibility (Hide When Inapplicable):**
  - If the user currently has **no avatar photo**, the "Remove current photo" action must be completely hidden (`View.GONE`).
  - Offering a button to delete something that does not exist creates cognitive friction and user confusion.
