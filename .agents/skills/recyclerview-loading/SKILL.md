---
name: recyclerview-loading
description: >
  Mandatory engineering and architectural rules for RecyclerView Data Caching, In-Memory Caching (0ms Instant Render),
  Stale-While-Revalidate Lifecycle, Text-First Immediate Rendering, Independent Asynchronous Image Loading,
  and User Action Authentication Gating across Android (Java/XML) and Web (React/Tailwind).
  Guarantees zero-blocking UI, zero Cumulative Layout Shift (CLS = 0), eliminates redundant network re-fetching on tab navigation,
  and prevents jarring skeleton flickering.
---

# RecyclerView Data Caching, Instant Rendering & Asynchronous Loading Architecture

This skill defines the non-negotiable architectural standard for managing list data, catalog items, cards, detail views, and user actions in EShop Verse. It eliminates redundant network calls on navigation, prevents UI thread stutter (jank) and layout jumps (CLS), guarantees 0ms instantaneous tab returns, and ensures users instantly read cached metadata while image assets and background revalidation stream asynchronously.

---

## 1. Core Principles

### 1.1 In-Memory Caching & Instant Return (0ms Perceived Latency)
- **Repository In-Memory Cache:** Repositories must maintain in-memory cache structures (`List<T>`, `Map<K, V>`) along with an acquisition timestamp (`cachedAtMillis`).
- **Instant UI Rendering on Navigation:** When navigating between bottom navigation destinations (e.g. Home ↔ Explore ↔ Cart ↔ Account) or popping the backstack, fragments must **never** wipe existing UI state with skeletons or blank screens if valid cached data exists.
- **Cache-First / Stale-While-Revalidate:**
  1. Render cached items synchronously on `onViewCreated` (perceived latency: **0ms**).
  2. If the cache is within its Time-to-Live (TTL, typically 5–10 minutes), do **not** trigger a network request.
  3. If the cache is expired, trigger a silent background revalidation without clearing the active view or showing blocking skeletons.
  4. Only explicit user gestures (such as **Pull-to-Refresh** via `SwipeRefreshLayout`) or active query/filter mutations force a fresh network invalidation.

### 1.2 Anti-Skeleton Anti-Pattern Guard
- **Skeletons are for Cold Start Only:** Skeleton adapters (e.g. `SkeletonAdapter`) may only be displayed during cold application launch when the repository has zero cached items.
- **Never Replace Populated Adapters with Skeletons:** In `Fragment.onViewCreated()`, never blindly re-attach `SkeletonAdapter` to RecyclerViews if the ViewModel or Repository already holds loaded data.
- **Never Clear Data on Loading State:** Emitting `UiState.loading()` must not discard previously displayed data if it is a background refresh.

### 1.3 Strict Payload Separation
- **API Payloads:** Network endpoints (REST/JSON) must only transmit text, numerical metadata, and image URLs (`String`). Never bundle raw binary or base64 image data within list payloads.
- **Immediate Text Binding:** All textual components (Title, Price, Stock Status, Discounts, Badges) must be bound and rendered synchronously to the UI thread (<100ms) the moment data arrives from memory or network.

### 1.4 Zero Cumulative Layout Shift (CLS = 0)
- **Fixed Aspect Ratio Viewports:** Every `ImageView` or image container must have an explicit, immutable aspect ratio or fixed dimension before image bytes arrive.
  - Catalog Grid Cards: `1:1` square (`app:layout_constraintDimensionRatio="1:1"`).
  - Editorial Hero / Banners: `16:9` (`app:layout_constraintDimensionRatio="16:9"`).
  - Product Detail Gallery: `4:5` or `1:1`.
  - Cart & Order Line Thumbnails: Fixed dimensions (e.g. `80dp x 80dp`).
- **Never use `wrap_content` for width or height** on network image containers.

### 1.5 Independent Asynchronous Streaming
- Each image is treated as a separate, independent network job dispatched to a background thread pool (managed via `ImageLoaderHelper` / Glide).
- If one image fails, times out, or has high latency, it must **never** delay, stall, or prevent adjacent text or other images from displaying.

### 1.6 Curated Placeholder & Seamless Cross-Fade
- **Instant Placeholder:** A refined placeholder (`@drawable/bg_placeholder_shimmer` or `@drawable/ic_image_placeholder`) is shown immediately when the view is bound.
- **Smooth Transition:** When the background bitmap decoding completes, it cross-fades into view smoothly (200–250ms) without flickering or white flashes.
- **Graceful Error:** Failed loads display an editorial vector (`@drawable/bg_placeholder_error`), never an empty void or broken link graphic.

### 1.7 Viewport-Scoped Lazy Loading & Request Cancellation
- Only items currently entering or inside the viewport issue image fetch requests.
- When an item scrolls out of view and its holder is recycled (`onViewRecycled`), pending network jobs for that view must be cancelled or deprioritized immediately (`ImageLoaderHelper.clear(imageView)`).

### 1.8 Strict Authentication Gating for User Actions (Favorites / Wishlist)
- **Protected Actions:** Features representing user-owned persistent state (e.g. Wishlist, Favorites, Saved Addresses, Orders) must verify authentication state (`AuthRepository.isSignedIn()`) prior to execution.
- **Unauthenticated Dialog Prompt:** When an unauthenticated (guest) user triggers a protected action (such as tapping a favorite heart on a product card, detail screen, or opening favorites navigation):
  1. Do not mutate local/server state silently.
  2. Present an anchored Material 3 Dialog or Bottom Sheet (`favorites_login_required_title`, `favorites_login_required_message`).
  3. Offer a clear primary action "Sign In" (`R.string.favorites_action_sign_in`) that navigates directly to `accountFragment`, and an optional dismiss action.
  4. In `AccountFragment`, unauthenticated guests should see a visual indicator (such as a sign-in badge or prompt) on protected cards rather than assuming offline-only persistence.

### 1.9 Taxonomy & Metadata Offline-First & Stale-While-Revalidate (SWR)
- **Metadata Permanence Principle:** High-permanence taxonomy and metadata (Categories, Tags, Filter Lists, Status Dictionaries) rarely mutate (<1% turnover). They must **never** be treated as ephemeral data re-fetched over the network on every screen load.
- **Two-Tier Storage (Memory + Disk):**
  1. **Tier 1 (RAM):** Hot in-memory collection (`List<Category>`) within singleton `CatalogRepository` for instant 0ms access across all fragments.
  2. **Tier 2 (Disk Persistence):** Serialized in local app storage (e.g. `SharedPreferences` or local database) upon arrival. On app launch (cold start), load from disk synchronously or near-instantaneously (<5ms) before initiating any network request.
- **Silent Background Revalidation (SWR):**
  1. Render disk/RAM cached categories/tags **immediately** on view initialization (zero skeletons).
  2. Dispatch a background revalidation request silently (e.g. using HTTP conditional headers `If-None-Match` / `ETag` or version hash).
  3. If server returns `304 Not Modified`, consume zero extra payload bytes and leave the UI untouched.
  4. If new or altered taxonomy arrives (`200 OK`), update local storage and notify the UI adapter seamlessly using `DiffUtil` without blanking or flickering.

### 1.10 Universal App-Wide Scope (Home, Explore, Search, Category Screens)
- Caching and anti-flicker policies apply **universally** across the entire application, not merely to `HomeFragment`:
  - `ExploreFragment` (All Products & Category Chips)
  - `CategoryProductsFragment` (Filtered by Category)
  - `SearchResultsFragment` (Query Results)
  - `ProductDetailFragment` (Product Metadata)
- Repositories must be application-wide singletons. Transient fragment-scoped ViewModels must read from the shared Repository cache so that navigating across navigation graph destinations does not incur cache misses or duplicate network trips.

### 1.11 Image Resolution Sizing, Thumbnail Downsampling & CDN Efficiency
- **Appropriate Thumbnail Dimensions:** Never download or decode full-size high-resolution images (e.g. 800x800 or 1200x1200px, 200KB–2MB) for small grid cards or thumbnail slots (typically 150dp–200dp on mobile, ~300x300px target).
- **Client Downsampling & Override:** Enforce Glide downsampling (`.override(300, 300)` or `DownsampleStrategy.AT_MOST`) to conserve device RAM and eliminate multi-second bitmap decoding.
- **Direct CDN Delivery:** In production backends, image URLs must point directly to an optimized CDN or static bucket (serving WebP/AVIF with immutable cache headers). Avoid external demo mock APIs (such as uncompressed `picsum.photos` with 302 redirect chains) that inflate latency by multiple seconds.

---

## 2. Android Implementation Standard (Java & XML)

### 2.1 Repository In-Memory Caching Pattern

```java
public class CatalogRepository {
    private static final long CACHE_TTL_MILLIS = 5 * 60 * 1000; // 5 minutes

    private List<ProductSummary> cachedProducts = new ArrayList<>();
    private long lastFetchedAt = 0;

    public boolean hasValidCache() {
        return !cachedProducts.isEmpty() && (System.currentTimeMillis() - lastFetchedAt < CACHE_TTL_MILLIS);
    }

    @NonNull
    public List<ProductSummary> getCachedProducts() {
        return Collections.unmodifiableList(new ArrayList<>(cachedProducts));
    }

    public void listProducts(@NonNull ProductParams params, boolean forceRefresh, @NonNull CatalogCallback<PagedResponse<ProductSummary>> callback) {
        // Return in-memory cache instantly if available and refresh is not forced
        if (!forceRefresh && params.getPage() == 1 && hasValidCache() && !params.hasActiveFilters()) {
            callback.onSuccess(new PagedResponse<>(getCachedProducts(), null));
            return;
        }

        // Otherwise dispatch network request...
        apiRoutes.getProducts(...).enqueue(new Callback<...>() {
            @Override
            public void onResponse(...) {
                if (response.isSuccessful() && response.body() != null) {
                    if (params.getPage() == 1 && !params.hasActiveFilters()) {
                        cachedProducts.clear();
                        cachedProducts.addAll(response.body().getData());
                        lastFetchedAt = System.currentTimeMillis();
                    }
                    callback.onSuccess(response.body());
                }
            }
        });
    }
}
```

### 2.2 Fragment Anti-Skeleton & 0ms Navigation Pattern

In `Fragment.onViewCreated`:

```java
@Override
public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
    super.onViewCreated(view, savedInstanceState);

    setupAdapters();
    observeViewModel();

    // Check if ViewModel or Repository already has data from previous visit
    if (catalogViewModel.hasData()) {
        // IMMEDIATELY bind existing data without showing skeletons
        binding.rvTrendingCarousel.setAdapter(trendingCarouselAdapter);
        trendingCarouselAdapter.submitList(catalogViewModel.getLoadedProducts());
    } else {
        // First cold launch: attach skeleton adapters
        binding.rvTrendingCarousel.setAdapter(new SkeletonAdapter(R.layout.item_skeleton_product_card, 4));
        catalogViewModel.loadFirstPage();
    }
}
```

### 2.3 Adapter Binding & Lifecycle Pattern

```java
@Override
public void onBindViewHolder(@NonNull MyViewHolder holder, int position) {
    ProductSummary product = items.get(position);

    // STEP 1: Synchronous Text & State Rendering (INSTANT - UI Thread)
    holder.binding.tvProductName.setText(product.getName());
    holder.binding.tvProductPrice.setText(MoneyFormat.format(product.getPriceMoney()));
    
    // Status badges & text-based conditions
    if (!product.isInStock()) {
        holder.binding.badgeOutOfStock.setVisibility(View.VISIBLE);
    } else {
        holder.binding.badgeOutOfStock.setVisibility(View.GONE);
    }

    // Accessibility content description
    holder.itemView.setContentDescription(product.getName() + ", " + MoneyFormat.format(product.getPriceMoney()));

    // STEP 2: Independent, Non-blocking Image Loading via ImageLoaderHelper
    ImageLoaderHelper.loadImage(
        holder.binding.ivProductImage,
        product.getImageUrl(),
        R.drawable.bg_placeholder_shimmer,
        R.drawable.bg_placeholder_error,
        true // centerCrop
    );
}

@Override
public void onViewRecycled(@NonNull MyViewHolder holder) {
    super.onViewRecycled(holder);
    // STEP 3: Cancel pending Glide requests when view leaves screen
    ImageLoaderHelper.clear(holder.binding.ivProductImage);
}
```

### 2.4 Protected Action Auth Gate Pattern (Favorites Example)

```java
binding.btnCardFavorite.setOnClickListener(v -> {
    boolean signedIn = AuthViewModelFactory.getDefaultRepository(itemView.getContext()).isSignedIn();
    if (signedIn) {
        favRepo.toggleFavorite(product);
        boolean newFav = favRepo.isFavorite(product.getId());
        updateFavoriteVisual(newFav);
    } else {
        new MaterialAlertDialogBuilder(itemView.getContext())
                .setTitle(R.string.favorites_login_required_title)
                .setMessage(R.string.favorites_login_required_message)
                .setPositiveButton(R.string.favorites_action_sign_in, (dialog, which) -> {
                    try {
                        NavController navController = Navigation.findNavController(itemView);
                        navController.navigate(R.id.accountFragment);
                    } catch (Exception ignored) {}
                })
                .setNegativeButton(R.string.common_cancel, null)
                .show();
    }
});
```

### 2.5 Category & Taxonomy SWR Caching Pattern

In `CatalogRepository`:

```java
public class CatalogRepository {
    private static final long CATEGORY_CACHE_TTL = 30 * 60 * 1000L; // 30 minutes
    private List<Category> cachedCategories = new ArrayList<>();
    private long lastCategoriesFetchedAt = 0;

    public boolean hasValidCategoryCache() {
        return !cachedCategories.isEmpty() && (System.currentTimeMillis() - lastCategoriesFetchedAt < CATEGORY_CACHE_TTL);
    }

    public List<Category> getCachedCategories() {
        return Collections.unmodifiableList(new ArrayList<>(cachedCategories));
    }

    public void listCategories(boolean forceRefresh, @NonNull CatalogCallback<List<Category>> callback) {
        // Instant synchronous return on warm cache
        if (!forceRefresh && hasValidCategoryCache()) {
            callback.onSuccess(getCachedCategories());
            return;
        }

        apiRoutes.listCategories().enqueue(new Callback<ApiResponse<List<Category>>>() {
            @Override
            public void onResponse(...) {
                if (response.isSuccessful() && response.body() != null) {
                    cachedCategories.clear();
                    cachedCategories.addAll(response.body().getData());
                    lastCategoriesFetchedAt = System.currentTimeMillis();
                    callback.onSuccess(getCachedCategories());
                }
            }
        });
    }
}
```

### 2.6 Explore Screen Anti-Skeleton & 0ms Navigation Pattern

In `ExploreFragment.java`:

```java
// Check warm category and product cache BEFORE attaching any adapter
if (categoryViewModel.hasData()) {
    renderCategoryChips(categoryViewModel.getCategories());
} else if (catalogRepository.hasValidCategoryCache()) {
    renderCategoryChips(catalogRepository.getCachedCategories());
} else {
    binding.rvCategories.setAdapter(new SkeletonAdapter(R.layout.item_skeleton_category_chip, 5));
    categoryViewModel.loadCategories();
}

if (catalogViewModel.hasData()) {
    binding.rvProducts.setAdapter(gridAdapter);
    gridAdapter.submitList(catalogViewModel.getLoadedProducts());
} else if (catalogRepository.hasValidCache()) {
    binding.rvProducts.setAdapter(gridAdapter);
    gridAdapter.submitList(catalogRepository.getCachedProducts());
} else {
    binding.rvProducts.setAdapter(new SkeletonAdapter(R.layout.item_skeleton_product_card, 6));
    catalogViewModel.loadFirstPage();
}
```

### 2.7 Image Downsampling & Decoding Optimization Pattern

In `ImageLoaderHelper.java`:

```java
// Force thumbnail downsampling on image grids to avoid decoding multi-megabyte 800x800 bitmaps
Glide.with(context)
    .load(imageUrl)
    .override(300, 300) // matches mobile viewport density without blowing up heap
    .downsample(DownsampleStrategy.AT_MOST)
    .placeholder(placeholderRes)
    .error(errorRes)
    .into(imageView);
```

---

## 3. Web & Admin Implementation Standard (React / TypeScript / Tailwind)

For Admin Dashboard and web components:

1. **Native Lazy Loading:** Always use `loading="lazy"` and `decoding="async"` on `<img>` tags.
2. **Fixed Aspect Ratios:** Use Tailwind aspect-ratio utilities (`aspect-square`, `aspect-video`) or explicit `width` and `height` attributes.
3. **Skeleton Pulse:** Use CSS shimmer or Tailwind `animate-pulse` on a background div until `onLoad` fires.
4. **Client SWR Caching:** Use React Query or SWR with `staleTime: 5 * 60 * 1000` to prevent redundant network refetching on page transitions.

---

## 4. Anti-Patterns to Strictly Avoid

- ❌ **NEVER replace populated adapters with skeleton adapters** when a fragment view is re-created on tab switch.
- ❌ **NEVER discard existing loaded items** when setting `UiState.loading()` during a background or pull-to-refresh reload.
- ❌ **NEVER trigger cold network reloads** on every tab navigation when valid in-memory cached data exists.
- ❌ **NEVER allow unauthenticated guest users** to mutate personal/cloud state (like Favorites) without a clear sign-in prompt dialog.
- ❌ **NEVER block the UI thread** or await image downloads in Repositories, ViewModels, or Adapters.
- ❌ **NEVER use `wrap_content`** on network image views (causes jarring layout reflows when images arrive).
- ❌ **NEVER call `notifyDataSetChanged()`** on list updates (destroys active ViewHolders and causes image flickering; use `DiffUtil`).
- ❌ **NEVER prefetch background images with high priority** (always use `Priority.LOW` so visible item rendering and text are never starved).

---

## 5. Execution Plan Reference

For the comprehensive implementation roadmap across all EShop Verse components, see:
👉 [`docs/ANDROID_ROADMAP.md`](../../docs/ANDROID_ROADMAP.md)
