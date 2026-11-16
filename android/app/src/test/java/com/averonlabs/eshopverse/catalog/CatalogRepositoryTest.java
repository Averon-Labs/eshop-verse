package com.averonlabs.eshopverse.catalog;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;

import com.averonlabs.eshopverse.ApiFixtureLoader;
import com.averonlabs.eshopverse.core.error.ApiErrorCodes;
import com.averonlabs.eshopverse.core.model.Category;
import com.averonlabs.eshopverse.core.model.ProductDetail;
import com.averonlabs.eshopverse.core.model.ProductSummary;
import com.averonlabs.eshopverse.core.money.Money;
import com.averonlabs.eshopverse.core.money.MoneyFormat;
import com.averonlabs.eshopverse.core.net.ApiClient;
import com.averonlabs.eshopverse.core.net.ApiException;
import com.averonlabs.eshopverse.core.net.PagedResponse;
import com.averonlabs.eshopverse.core.storage.InMemoryTokenStore;

import org.junit.After;
import org.junit.Before;
import org.junit.Test;

import java.io.IOException;
import java.math.BigDecimal;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;

import okhttp3.mockwebserver.MockResponse;
import okhttp3.mockwebserver.MockWebServer;
import okhttp3.mockwebserver.RecordedRequest;

/**
 * JVM unit tests for {@link CatalogRepository} per docs/android/PHASE-1-SPEC.md §E.7.
 * Covers summary and detail parsing, image ordering, 422 CATEGORY_NOT_FOUND, 404, 429,
 * pagination metadata, and verifies that prices render cleanly without binary floating-point conversions.
 */
public class CatalogRepositoryTest {

    private MockWebServer mockWebServer;
    private CatalogRepository repository;

    @Before
    public void setUp() throws IOException {
        mockWebServer = new MockWebServer();
        mockWebServer.start();

        ApiClient apiClient = new ApiClient(
                mockWebServer.url("/api/v1/").toString(),
                new InMemoryTokenStore(),
                null,
                false
        );
        repository = new CatalogRepository(apiClient.getRoutes());
    }

    @After
    public void tearDown() throws IOException {
        mockWebServer.shutdown();
    }

    @Test
    public void testListProductsSuccessAndMoneyAssertion() throws Exception {
        String fixture = ApiFixtureLoader.load("listProducts", "success");
        mockWebServer.enqueue(new MockResponse()
                .setResponseCode(200)
                .setHeader("Content-Type", "application/json")
                .setBody(fixture));

        AtomicReference<PagedResponse<ProductSummary>> resultRef = new AtomicReference<>();
        CountDownLatch latch = new CountDownLatch(1);

        repository.listProducts(new ProductParams(), new CatalogRepository.CatalogCallback<PagedResponse<ProductSummary>>() {
            @Override
            public void onSuccess(PagedResponse<ProductSummary> result) {
                resultRef.set(result);
                latch.countDown();
            }

            @Override
            public void onError(Throwable throwable) {
                latch.countDown();
            }
        });

        assertTrue(latch.await(3, TimeUnit.SECONDS));
        PagedResponse<ProductSummary> response = resultRef.get();
        assertNotNull(response);

        List<ProductSummary> products = response.getData();
        assertEquals(2, products.size());

        ProductSummary p1 = products.get(0);
        assertEquals(101, p1.getId());
        assertEquals("Classic Leather Sneaker", p1.getName());
        assertEquals("89.99", p1.getPrice());
        assertEquals("$89.99", MoneyFormat.format(p1.getPriceMoney()));
        assertEquals("$89.99", MoneyFormat.format(p1.getPrice()));

        // Verification of strict decimal money representation (no binary float/double)
        Money money = p1.getPriceMoney();
        assertEquals("89.99", money.toString());
        assertEquals(new BigDecimal("89.99"), money.getAmount());

        // Pagination metadata
        assertNotNull(response.getPagination());
        assertEquals(1, response.getPagination().getCurrentPage());
        assertEquals(20, response.getPagination().getPerPage());
        assertEquals(2, response.getPagination().getTotalItems());
        assertEquals(1, response.getPagination().getTotalPages());
        assertFalse(response.hasMore());

        RecordedRequest request = mockWebServer.takeRequest();
        assertEquals("GET", request.getMethod());
        assertTrue(request.getPath().contains("/api/v1/products"));
    }

    @Test
    public void testGetProductDetailSuccessAndImageOrdering() throws Exception {
        String fixture = ApiFixtureLoader.load("getProduct", "success");
        mockWebServer.enqueue(new MockResponse()
                .setResponseCode(200)
                .setHeader("Content-Type", "application/json")
                .setBody(fixture));

        AtomicReference<ProductDetail> resultRef = new AtomicReference<>();
        CountDownLatch latch = new CountDownLatch(1);

        repository.getProduct(101L, new CatalogRepository.CatalogCallback<ProductDetail>() {
            @Override
            public void onSuccess(ProductDetail result) {
                resultRef.set(result);
                latch.countDown();
            }

            @Override
            public void onError(Throwable throwable) {
                latch.countDown();
            }
        });

        assertTrue(latch.await(3, TimeUnit.SECONDS));
        ProductDetail detail = resultRef.get();
        assertNotNull(detail);

        assertEquals(101, detail.getId());
        assertEquals("Classic Leather Sneaker", detail.getName());
        assertNotNull(detail.getDescription());
        assertTrue(detail.getDescription().contains("full-grain leather"));
        assertEquals("89.99", detail.getPrice());
        assertEquals("$89.99", MoneyFormat.format(detail.getPriceMoney()));

        // Image ordering
        assertNotNull(detail.getImages());
        assertFalse(detail.getImages().isEmpty());
        assertEquals(1, detail.getImages().get(0).getSortOrder());
        assertEquals("https://images.example.com/products/sneaker-1.jpg", detail.getImages().get(0).getUrl());

        RecordedRequest request = mockWebServer.takeRequest();
        assertEquals("/api/v1/products/101", request.getPath());
    }

    @Test
    public void testListCategoriesSuccess() throws Exception {
        String fixture = ApiFixtureLoader.load("listCategories", "success");
        mockWebServer.enqueue(new MockResponse()
                .setResponseCode(200)
                .setHeader("Content-Type", "application/json")
                .setBody(fixture));

        AtomicReference<List<Category>> resultRef = new AtomicReference<>();
        CountDownLatch latch = new CountDownLatch(1);

        repository.listCategories(new CatalogRepository.CatalogCallback<List<Category>>() {
            @Override
            public void onSuccess(List<Category> result) {
                resultRef.set(result);
                latch.countDown();
            }

            @Override
            public void onError(Throwable throwable) {
                latch.countDown();
            }
        });

        assertTrue(latch.await(3, TimeUnit.SECONDS));
        List<Category> categories = resultRef.get();
        assertNotNull(categories);
        assertEquals(1, categories.size());
        assertEquals("Footwear", categories.get(0).getName());
        assertEquals(1, categories.get(0).getId());
    }

    @Test
    public void testCategoryNotFound422Mapping() throws Exception {
        String errorJson = "{\n" +
                "  \"error\": {\n" +
                "    \"code\": \"CATEGORY_NOT_FOUND\",\n" +
                "    \"message\": \"Category not found or archived\"\n" +
                "  }\n" +
                "}";

        mockWebServer.enqueue(new MockResponse()
                .setResponseCode(422)
                .setHeader("Content-Type", "application/json")
                .setBody(errorJson));

        AtomicReference<Throwable> errorRef = new AtomicReference<>();
        CountDownLatch latch = new CountDownLatch(1);

        ProductParams params = new ProductParams().withCategoryId(999L);
        repository.listProducts(params, new CatalogRepository.CatalogCallback<PagedResponse<ProductSummary>>() {
            @Override
            public void onSuccess(PagedResponse<ProductSummary> result) {
                latch.countDown();
            }

            @Override
            public void onError(Throwable throwable) {
                errorRef.set(throwable);
                latch.countDown();
            }
        });

        assertTrue(latch.await(3, TimeUnit.SECONDS));
        assertTrue(errorRef.get() instanceof ApiException);
        ApiException apiException = (ApiException) errorRef.get();
        assertEquals(422, apiException.getHttpStatus());
        assertEquals(ApiErrorCodes.CATEGORY_NOT_FOUND, apiException.getCode());
    }

    @Test
    public void testProductNotFound404Mapping() throws Exception {
        String errorJson = "{\n" +
                "  \"error\": {\n" +
                "    \"code\": \"NOT_FOUND\",\n" +
                "    \"message\": \"Product not found\"\n" +
                "  }\n" +
                "}";

        mockWebServer.enqueue(new MockResponse()
                .setResponseCode(404)
                .setHeader("Content-Type", "application/json")
                .setBody(errorJson));

        AtomicReference<Throwable> errorRef = new AtomicReference<>();
        CountDownLatch latch = new CountDownLatch(1);

        repository.getProduct(9999L, new CatalogRepository.CatalogCallback<ProductDetail>() {
            @Override
            public void onSuccess(ProductDetail result) {
                latch.countDown();
            }

            @Override
            public void onError(Throwable throwable) {
                errorRef.set(throwable);
                latch.countDown();
            }
        });

        assertTrue(latch.await(3, TimeUnit.SECONDS));
        assertTrue(errorRef.get() instanceof ApiException);
        ApiException apiException = (ApiException) errorRef.get();
        assertEquals(404, apiException.getHttpStatus());
        assertEquals(ApiErrorCodes.NOT_FOUND, apiException.getCode());
    }

    @Test
    public void testRateLimited429Mapping() throws Exception {
        String fixture = ApiFixtureLoader.load("common", "rate-limited");
        mockWebServer.enqueue(new MockResponse()
                .setResponseCode(429)
                .setHeader("Retry-After", "30")
                .setHeader("Content-Type", "application/json")
                .setBody(fixture));

        AtomicReference<Throwable> errorRef = new AtomicReference<>();
        CountDownLatch latch = new CountDownLatch(1);

        repository.listProducts(new ProductParams(), new CatalogRepository.CatalogCallback<PagedResponse<ProductSummary>>() {
            @Override
            public void onSuccess(PagedResponse<ProductSummary> result) {
                latch.countDown();
            }

            @Override
            public void onError(Throwable throwable) {
                errorRef.set(throwable);
                latch.countDown();
            }
        });

        assertTrue(latch.await(3, TimeUnit.SECONDS));
        assertTrue(errorRef.get() instanceof ApiException);
        ApiException apiException = (ApiException) errorRef.get();
        assertEquals(429, apiException.getHttpStatus());
        assertEquals(ApiErrorCodes.RATE_LIMITED, apiException.getCode());
    }

    @Test
    public void testListProductsReturnsCachedProductsWhenCacheValid() throws Exception {
        String fixture = ApiFixtureLoader.load("listProducts", "success");
        mockWebServer.enqueue(new MockResponse()
                .setResponseCode(200)
                .setHeader("Content-Type", "application/json")
                .setBody(fixture));

        AtomicReference<PagedResponse<ProductSummary>> ref1 = new AtomicReference<>();
        CountDownLatch latch1 = new CountDownLatch(1);
        repository.listProducts(new ProductParams(), new CatalogRepository.CatalogCallback<PagedResponse<ProductSummary>>() {
            @Override
            public void onSuccess(PagedResponse<ProductSummary> result) {
                ref1.set(result);
                latch1.countDown();
            }

            @Override
            public void onError(Throwable throwable) {
                latch1.countDown();
            }
        });

        assertTrue(latch1.await(3, TimeUnit.SECONDS));
        assertNotNull(ref1.get());
        assertTrue(repository.hasValidCache());
        assertEquals(2, repository.getCachedProducts().size());
        assertEquals(1, mockWebServer.getRequestCount());

        // Second call with warm cache - note NO mock response is enqueued!
        AtomicReference<PagedResponse<ProductSummary>> ref2 = new AtomicReference<>();
        repository.listProducts(new ProductParams(), false, new CatalogRepository.CatalogCallback<PagedResponse<ProductSummary>>() {
            @Override
            public void onSuccess(PagedResponse<ProductSummary> result) {
                ref2.set(result);
            }

            @Override
            public void onError(Throwable throwable) {
            }
        });

        // Returned synchronously in 0ms from cache without hitting server
        assertNotNull(ref2.get());
        assertEquals(2, ref2.get().getData().size());
        assertEquals(1, mockWebServer.getRequestCount());
    }

    @Test
    public void testListProductsBypassesCacheWhenForceRefreshTrue() throws Exception {
        String fixture = ApiFixtureLoader.load("listProducts", "success");
        // Enqueue two responses
        mockWebServer.enqueue(new MockResponse().setResponseCode(200).setHeader("Content-Type", "application/json").setBody(fixture));
        mockWebServer.enqueue(new MockResponse().setResponseCode(200).setHeader("Content-Type", "application/json").setBody(fixture));

        CountDownLatch latch1 = new CountDownLatch(1);
        repository.listProducts(new ProductParams(), new CatalogRepository.CatalogCallback<PagedResponse<ProductSummary>>() {
            @Override
            public void onSuccess(PagedResponse<ProductSummary> result) {
                latch1.countDown();
            }

            @Override
            public void onError(Throwable throwable) {
                latch1.countDown();
            }
        });
        assertTrue(latch1.await(3, TimeUnit.SECONDS));
        assertEquals(1, mockWebServer.getRequestCount());

        // Second call with forceRefresh = true must hit the network
        CountDownLatch latch2 = new CountDownLatch(1);
        repository.listProducts(new ProductParams(), true, new CatalogRepository.CatalogCallback<PagedResponse<ProductSummary>>() {
            @Override
            public void onSuccess(PagedResponse<ProductSummary> result) {
                latch2.countDown();
            }

            @Override
            public void onError(Throwable throwable) {
                latch2.countDown();
            }
        });
        assertTrue(latch2.await(3, TimeUnit.SECONDS));
        assertEquals(2, mockWebServer.getRequestCount());
    }

    @Test
    public void testListProductsFetchesFromNetworkWhenCacheExpired() throws Exception {
        String fixture = ApiFixtureLoader.load("listProducts", "success");
        mockWebServer.enqueue(new MockResponse().setResponseCode(200).setHeader("Content-Type", "application/json").setBody(fixture));
        mockWebServer.enqueue(new MockResponse().setResponseCode(200).setHeader("Content-Type", "application/json").setBody(fixture));

        CountDownLatch latch1 = new CountDownLatch(1);
        repository.listProducts(new ProductParams(), new CatalogRepository.CatalogCallback<PagedResponse<ProductSummary>>() {
            @Override
            public void onSuccess(PagedResponse<ProductSummary> result) {
                latch1.countDown();
            }

            @Override
            public void onError(Throwable throwable) {
                latch1.countDown();
            }
        });
        assertTrue(latch1.await(3, TimeUnit.SECONDS));
        assertTrue(repository.hasValidCache());

        // Expire cache manually: set timestamp to 6 minutes ago
        repository.setCacheForTesting(repository.getCachedProducts(), System.currentTimeMillis() - (6 * 60 * 1000L));
        assertFalse(repository.hasValidCache());

        // Next call must hit network because cache is expired
        CountDownLatch latch2 = new CountDownLatch(1);
        repository.listProducts(new ProductParams(), false, new CatalogRepository.CatalogCallback<PagedResponse<ProductSummary>>() {
            @Override
            public void onSuccess(PagedResponse<ProductSummary> result) {
                latch2.countDown();
            }

            @Override
            public void onError(Throwable throwable) {
                latch2.countDown();
            }
        });
        assertTrue(latch2.await(3, TimeUnit.SECONDS));
        assertEquals(2, mockWebServer.getRequestCount());
    }

    @Test
    public void testListCategoriesReturnsCachedWhenAvailable() throws Exception {
        String fixture = ApiFixtureLoader.load("listCategories", "success");
        mockWebServer.enqueue(new MockResponse().setResponseCode(200).setHeader("Content-Type", "application/json").setBody(fixture));

        CountDownLatch latch1 = new CountDownLatch(1);
        repository.listCategories(new CatalogRepository.CatalogCallback<List<Category>>() {
            @Override
            public void onSuccess(List<Category> result) {
                latch1.countDown();
            }

            @Override
            public void onError(Throwable throwable) {
                latch1.countDown();
            }
        });
        assertTrue(latch1.await(3, TimeUnit.SECONDS));
        assertEquals(1, mockWebServer.getRequestCount());
        assertTrue(repository.hasValidCategoryCache());
        assertEquals(1, repository.getCachedCategories().size());

        // Second call with forceRefresh = false returns synchronous cached items without network call
        CountDownLatch latch2 = new CountDownLatch(1);
        AtomicReference<List<Category>> cachedResultRef = new AtomicReference<>();
        repository.listCategories(false, new CatalogRepository.CatalogCallback<List<Category>>() {
            @Override
            public void onSuccess(List<Category> result) {
                cachedResultRef.set(result);
                latch2.countDown();
            }

            @Override
            public void onError(Throwable throwable) {
                latch2.countDown();
            }
        });
        assertTrue(latch2.await(1, TimeUnit.SECONDS));
        assertEquals(1, mockWebServer.getRequestCount()); // Still 1! No new request
        assertNotNull(cachedResultRef.get());
        assertEquals(1, cachedResultRef.get().size());
    }

    @Test
    public void testListCategoriesBypassesCacheWhenForceRefreshTrue() throws Exception {
        String fixture = ApiFixtureLoader.load("listCategories", "success");
        mockWebServer.enqueue(new MockResponse().setResponseCode(200).setHeader("Content-Type", "application/json").setBody(fixture));
        mockWebServer.enqueue(new MockResponse().setResponseCode(200).setHeader("Content-Type", "application/json").setBody(fixture));

        CountDownLatch latch1 = new CountDownLatch(1);
        repository.listCategories(new CatalogRepository.CatalogCallback<List<Category>>() {
            @Override
            public void onSuccess(List<Category> result) {
                latch1.countDown();
            }

            @Override
            public void onError(Throwable throwable) {
                latch1.countDown();
            }
        });
        assertTrue(latch1.await(3, TimeUnit.SECONDS));
        assertEquals(1, mockWebServer.getRequestCount());

        // Second call with forceRefresh = true hits network again
        CountDownLatch latch2 = new CountDownLatch(1);
        repository.listCategories(true, new CatalogRepository.CatalogCallback<List<Category>>() {
            @Override
            public void onSuccess(List<Category> result) {
                latch2.countDown();
            }

            @Override
            public void onError(Throwable throwable) {
                latch2.countDown();
            }
        });
        assertTrue(latch2.await(3, TimeUnit.SECONDS));
        assertEquals(2, mockWebServer.getRequestCount());
    }

    @Test
    public void testListCategoriesFetchesFromNetworkWhenCacheExpired() throws Exception {
        String fixture = ApiFixtureLoader.load("listCategories", "success");
        mockWebServer.enqueue(new MockResponse().setResponseCode(200).setHeader("Content-Type", "application/json").setBody(fixture));
        mockWebServer.enqueue(new MockResponse().setResponseCode(200).setHeader("Content-Type", "application/json").setBody(fixture));

        CountDownLatch latch1 = new CountDownLatch(1);
        repository.listCategories(new CatalogRepository.CatalogCallback<List<Category>>() {
            @Override
            public void onSuccess(List<Category> result) {
                latch1.countDown();
            }

            @Override
            public void onError(Throwable throwable) {
                latch1.countDown();
            }
        });
        assertTrue(latch1.await(3, TimeUnit.SECONDS));
        assertTrue(repository.hasValidCategoryCache());

        // Expire category cache (set to 31 minutes ago)
        repository.setCategoryCacheForTesting(repository.getCachedCategories(), System.currentTimeMillis() - (31 * 60 * 1000L));
        assertFalse(repository.hasValidCategoryCache());

        CountDownLatch latch2 = new CountDownLatch(1);
        repository.listCategories(false, new CatalogRepository.CatalogCallback<List<Category>>() {
            @Override
            public void onSuccess(List<Category> result) {
                latch2.countDown();
            }

            @Override
            public void onError(Throwable throwable) {
                latch2.countDown();
            }
        });
        assertTrue(latch2.await(3, TimeUnit.SECONDS));
        assertEquals(2, mockWebServer.getRequestCount());
    }
}
