package com.averonlabs.eshopverse.catalog;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.annotation.VisibleForTesting;

import com.averonlabs.eshopverse.core.model.Category;
import com.averonlabs.eshopverse.core.model.Pagination;
import com.averonlabs.eshopverse.core.model.ProductDetail;
import com.averonlabs.eshopverse.core.model.ProductSummary;
import com.averonlabs.eshopverse.core.net.ApiErrorMapper;
import com.averonlabs.eshopverse.core.net.ApiException;
import com.averonlabs.eshopverse.core.net.ApiResponse;
import com.averonlabs.eshopverse.core.net.ApiRoutes;
import com.averonlabs.eshopverse.core.net.PagedResponse;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Objects;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

/**
 * Repository coordinating product and category catalog operations per docs/android/PHASE-1-SPEC.md §E
 * and Phase 13 in-memory caching per .agents/skills/recyclerview-loading/SKILL.md.
 */
public class CatalogRepository {

    public static final long CACHE_TTL_MILLIS = 5 * 60 * 1000L; // 5 minutes

    public interface CatalogCallback<T> {
        void onSuccess(T result);
        void onError(Throwable throwable);
    }

    private final ApiRoutes apiRoutes;
    private final List<ProductSummary> inMemoryProductCache = new ArrayList<>();
    private long lastCacheTimestamp = 0;

    public CatalogRepository(@NonNull ApiRoutes apiRoutes) {
        this.apiRoutes = Objects.requireNonNull(apiRoutes, "apiRoutes cannot be null");
    }

    /**
     * Checks if in-memory cache is present and within TTL.
     */
    public synchronized boolean hasValidCache() {
        return !inMemoryProductCache.isEmpty() && (System.currentTimeMillis() - lastCacheTimestamp < CACHE_TTL_MILLIS);
    }

    /**
     * Returns an unmodifiable snapshot of cached products.
     */
    @NonNull
    public synchronized List<ProductSummary> getCachedProducts() {
        return Collections.unmodifiableList(new ArrayList<>(inMemoryProductCache));
    }

    /**
     * Clears in-memory catalog cache.
     */
    public synchronized void clearCache() {
        inMemoryProductCache.clear();
        lastCacheTimestamp = 0;
    }

    @VisibleForTesting
    public synchronized void setCacheForTesting(@NonNull List<ProductSummary> items, long timestamp) {
        inMemoryProductCache.clear();
        inMemoryProductCache.addAll(items);
        lastCacheTimestamp = timestamp;
    }

    /**
     * Retrieves the list of active product categories (GET /categories).
     */
    public void listCategories(@NonNull CatalogCallback<List<Category>> callback) {
        apiRoutes.listCategories().enqueue(new Callback<ApiResponse<List<Category>>>() {
            @Override
            public void onResponse(
                    @NonNull Call<ApiResponse<List<Category>>> call,
                    @NonNull Response<ApiResponse<List<Category>>> response
            ) {
                if (response.isSuccessful() && response.body() != null) {
                    List<Category> data = response.body().getData();
                    callback.onSuccess(data != null ? data : Collections.emptyList());
                } else {
                    callback.onError(parseError(response));
                }
            }

            @Override
            public void onFailure(
                    @NonNull Call<ApiResponse<List<Category>>> call,
                    @NonNull Throwable t
            ) {
                callback.onError(t);
            }
        });
    }

    /**
     * Lists, searches, and paginates products matching the provided query parameters (GET /products).
     * Defaults forceRefresh to false (utilizes in-memory cache when valid).
     */
    public void listProducts(
            @NonNull ProductParams params,
            @NonNull CatalogCallback<PagedResponse<ProductSummary>> callback
    ) {
        listProducts(params, false, callback);
    }

    /**
     * Lists products with explicit control over cache bypass.
     */
    public void listProducts(
            @NonNull ProductParams params,
            boolean forceRefresh,
            @NonNull CatalogCallback<PagedResponse<ProductSummary>> callback
    ) {
        // Synchronous 0ms return if cache is valid and not forced to refresh
        if (!forceRefresh && params.getPage() == 1 && !hasActiveFilters(params) && hasValidCache()) {
            List<ProductSummary> cached = getCachedProducts();
            Pagination pagination = new Pagination(1, params.getPerPage(), cached.size(), 1);
            callback.onSuccess(new PagedResponse<>(cached, pagination));
            return;
        }

        apiRoutes.listProducts(
                params.getPage(),
                params.getPerPage(),
                params.getCategoryId(),
                params.getQ(),
                params.getSort()
        ).enqueue(new Callback<PagedResponse<ProductSummary>>() {
            @Override
            public void onResponse(
                    @NonNull Call<PagedResponse<ProductSummary>> call,
                    @NonNull Response<PagedResponse<ProductSummary>> response
            ) {
                if (response.isSuccessful() && response.body() != null) {
                    PagedResponse<ProductSummary> body = response.body();
                    if (params.getPage() == 1 && !hasActiveFilters(params) && body.getData() != null) {
                        synchronized (CatalogRepository.this) {
                            inMemoryProductCache.clear();
                            inMemoryProductCache.addAll(body.getData());
                            lastCacheTimestamp = System.currentTimeMillis();
                        }
                    }
                    callback.onSuccess(body);
                } else {
                    callback.onError(parseError(response));
                }
            }

            @Override
            public void onFailure(
                    @NonNull Call<PagedResponse<ProductSummary>> call,
                    @NonNull Throwable t
            ) {
                callback.onError(t);
            }
        });
    }

    private boolean hasActiveFilters(@NonNull ProductParams params) {
        return params.getCategoryId() != null
                || (params.getQ() != null && !params.getQ().trim().isEmpty())
                || (params.getSort() != null && !ProductParams.SORT_NEWEST.equals(params.getSort()))
                || params.getMinPrice() != null
                || params.getMaxPrice() != null
                || Boolean.TRUE.equals(params.getInStock());
    }

    /**
     * Fetches detailed information for a single product by ID (GET /products/{productId}).
     */
    public void getProduct(long productId, @NonNull CatalogCallback<ProductDetail> callback) {
        apiRoutes.getProduct(productId).enqueue(new Callback<ApiResponse<ProductDetail>>() {
            @Override
            public void onResponse(
                    @NonNull Call<ApiResponse<ProductDetail>> call,
                    @NonNull Response<ApiResponse<ProductDetail>> response
            ) {
                if (response.isSuccessful() && response.body() != null && response.body().getData() != null) {
                    callback.onSuccess(response.body().getData());
                } else {
                    callback.onError(parseError(response));
                }
            }

            @Override
            public void onFailure(
                    @NonNull Call<ApiResponse<ProductDetail>> call,
                    @NonNull Throwable t
            ) {
                callback.onError(t);
            }
        });
    }

    @NonNull
    private ApiException parseError(@NonNull Response<?> response) {
        String body = null;
        if (response.errorBody() != null) {
            try {
                body = response.errorBody().string();
            } catch (IOException ignored) {
            }
        }
        return ApiErrorMapper.map(response.code(), body);
    }
}
