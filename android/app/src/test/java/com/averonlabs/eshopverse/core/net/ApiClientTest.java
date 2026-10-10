package com.averonlabs.eshopverse.core.net;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

import com.averonlabs.eshopverse.ApiFixtureLoader;
import com.averonlabs.eshopverse.core.error.ApiErrorCodes;
import com.averonlabs.eshopverse.core.model.Category;
import com.averonlabs.eshopverse.core.model.CreateOrderRequest;
import com.averonlabs.eshopverse.core.model.Order;
import com.averonlabs.eshopverse.core.model.Pagination;
import com.averonlabs.eshopverse.core.model.ProductDetail;
import com.averonlabs.eshopverse.core.model.ProductSummary;
import com.averonlabs.eshopverse.core.model.ShippingAddress;
import com.averonlabs.eshopverse.core.storage.InMemoryTokenStore;

import org.junit.After;
import org.junit.Before;
import org.junit.Test;

import java.io.IOException;
import java.util.Collections;
import java.util.List;

import okhttp3.mockwebserver.MockResponse;
import okhttp3.mockwebserver.MockWebServer;
import okhttp3.mockwebserver.RecordedRequest;
import retrofit2.Response;

public class ApiClientTest {

    private MockWebServer mockWebServer;
    private InMemoryTokenStore tokenStore;
    private UnauthenticatedHandler unauthenticatedHandler;
    private ApiClient apiClient;

    @Before
    public void setUp() throws IOException {
        mockWebServer = new MockWebServer();
        mockWebServer.start();

        tokenStore = new InMemoryTokenStore();
        unauthenticatedHandler = mock(UnauthenticatedHandler.class);

        apiClient = new ApiClient(
                mockWebServer.url("/api/v1/").toString(),
                tokenStore,
                unauthenticatedHandler,
                true // isDebug
        );
    }

    @After
    public void tearDown() throws IOException {
        mockWebServer.shutdown();
    }

    @Test
    public void testSuccessEnvelopeParsing() throws IOException {
        String fixture = ApiFixtureLoader.load("listProducts", "success");
        mockWebServer.enqueue(new MockResponse()
                .setResponseCode(200)
                .setHeader("Content-Type", "application/json")
                .setBody(fixture));

        Response<PagedResponse<ProductSummary>> response = apiClient.getRoutes()
                .listProducts(1, 20, null, null, null)
                .execute();

        assertTrue(response.isSuccessful());
        PagedResponse<ProductSummary> body = response.body();
        assertNotNull(body);
        assertEquals(2, body.getData().size());

        ProductSummary first = body.getData().get(0);
        assertEquals(101, first.getId());
        assertEquals("Classic Leather Sneaker", first.getName());
        assertEquals("89.99", first.getPrice());

        Pagination pagination = body.getPagination();
        assertNotNull(pagination);
        assertEquals(1, pagination.getCurrentPage());
        assertEquals(20, pagination.getPerPage());
        assertEquals(2, pagination.getTotalItems());
        assertEquals(1, pagination.getTotalPages());
        assertFalse("At totalPages, hasMore must be false", body.hasMore());
    }

    @Test
    public void testErrorEnvelopeMapping() throws IOException {
        // 1. 401 Unauthenticated
        String unauthBody = ApiFixtureLoader.load("common", "unauthenticated");
        ApiException unauthEx = ApiErrorMapper.map(401, unauthBody);
        assertEquals(401, unauthEx.getHttpStatus());
        assertEquals(ApiErrorCodes.UNAUTHENTICATED, unauthEx.getCode());

        // 2. 404 Not Found
        String notFoundBody = ApiFixtureLoader.load("getProduct", "not-found");
        ApiException notFoundEx = ApiErrorMapper.map(404, notFoundBody);
        assertEquals(404, notFoundEx.getHttpStatus());
        assertEquals(ApiErrorCodes.NOT_FOUND, notFoundEx.getCode());

        // 3. 409 Insufficient Stock
        String conflictBody = ApiFixtureLoader.load("createOrder", "insufficient-stock");
        ApiException conflictEx = ApiErrorMapper.map(409, conflictBody);
        assertEquals(409, conflictEx.getHttpStatus());
        assertEquals(ApiErrorCodes.INSUFFICIENT_STOCK, conflictEx.getCode());
        assertTrue(conflictEx.getFieldErrors().containsKey("items"));

        // 4. 422 Validation Error
        String validationBody = ApiFixtureLoader.load("common", "validation-error");
        ApiException validationEx = ApiErrorMapper.map(422, validationBody);
        assertEquals(422, validationEx.getHttpStatus());
        assertEquals(ApiErrorCodes.VALIDATION_ERROR, validationEx.getCode());
        assertEquals(2, validationEx.getFieldErrors().size());
        assertTrue(validationEx.getFieldErrors().containsKey("email"));
        assertTrue(validationEx.getFieldErrors().containsKey("password"));

        // 5. 429 Rate Limited
        String rateLimitBody = ApiFixtureLoader.load("common", "rate-limited");
        ApiException rateLimitEx = ApiErrorMapper.map(429, rateLimitBody);
        assertEquals(429, rateLimitEx.getHttpStatus());
        assertEquals(ApiErrorCodes.RATE_LIMITED, rateLimitEx.getCode());

        // 6. 500 Server Error
        String serverErrorBody = ApiFixtureLoader.load("common", "server-error");
        ApiException serverErrorEx = ApiErrorMapper.map(500, serverErrorBody);
        assertEquals(500, serverErrorEx.getHttpStatus());
        assertEquals(ApiErrorCodes.INTERNAL_ERROR, serverErrorEx.getCode());
    }

    @Test
    public void testAuthHeaderPresenceAndAbsence() throws IOException, InterruptedException {
        // Token present
        tokenStore.save("secret-bearer-token", "2099-01-01T00:00:00Z");
        String categoriesFixture = ApiFixtureLoader.load("listCategories", "success");
        mockWebServer.enqueue(new MockResponse().setResponseCode(200).setBody(categoriesFixture));

        apiClient.getRoutes().listCategories().execute();
        RecordedRequest req1 = mockWebServer.takeRequest();
        assertEquals("Bearer secret-bearer-token", req1.getHeader("Authorization"));

        // Token absent
        tokenStore.clear();
        mockWebServer.enqueue(new MockResponse().setResponseCode(200).setBody(categoriesFixture));

        apiClient.getRoutes().listCategories().execute();
        RecordedRequest req2 = mockWebServer.takeRequest();
        assertNull(req2.getHeader("Authorization"));
    }

    @Test
    public void testUnauthenticatedHookInvokedOn401() throws IOException {
        String unauthBody = ApiFixtureLoader.load("common", "unauthenticated");
        mockWebServer.enqueue(new MockResponse().setResponseCode(401).setBody(unauthBody));

        apiClient.getRoutes().getCart().execute();

        verify(unauthenticatedHandler, times(1)).onUnauthenticated();
    }

    @Test
    public void testIdempotencyKeyAutoGeneratedAndPreserved() throws IOException, InterruptedException {
        String orderFixture = ApiFixtureLoader.load("createOrder", "success");
        ShippingAddress address = new ShippingAddress("John Doe", "123 Main St", null, "Metropolis", "NY", "10001", "US");

        // 1. Auto-generated fresh UUID when not provided
        mockWebServer.enqueue(new MockResponse().setResponseCode(201).setBody(orderFixture));
        apiClient.getRoutes().createOrder(new CreateOrderRequest(address, null)).execute();

        RecordedRequest req1 = mockWebServer.takeRequest();
        String autoKey = req1.getHeader("Idempotency-Key");
        assertNotNull(autoKey);
        assertFalse(autoKey.trim().isEmpty());

        // 2. Caller-supplied key preserved across logical attempt
        mockWebServer.enqueue(new MockResponse().setResponseCode(201).setBody(orderFixture));
        apiClient.getRoutes().createOrder("fixed-client-uuid-12345", new CreateOrderRequest(address, null)).execute();

        RecordedRequest req2 = mockWebServer.takeRequest();
        assertEquals("fixed-client-uuid-12345", req2.getHeader("Idempotency-Key"));
    }

    @Test
    public void testNoRetryRuleOnMutationFailure() throws IOException {
        String conflictBody = ApiFixtureLoader.load("createOrder", "insufficient-stock");
        mockWebServer.enqueue(new MockResponse().setResponseCode(409).setBody(conflictBody));

        ShippingAddress address = new ShippingAddress("John Doe", "123 Main St", null, "Metropolis", "NY", "10001", "US");
        apiClient.getRoutes().createOrder(new CreateOrderRequest(address, null)).execute();

        // Exactly one request must be dispatched to server, no auto-retrying on 409
        assertEquals(1, mockWebServer.getRequestCount());
    }

    @Test
    public void testRetryOnSafeGetFailure() throws IOException {
        String categoriesFixture = ApiFixtureLoader.load("listCategories", "success");
        // Enqueue 500 error, then 200 success
        mockWebServer.enqueue(new MockResponse().setResponseCode(500).setBody("Server Error"));
        mockWebServer.enqueue(new MockResponse().setResponseCode(200).setBody(categoriesFixture));

        Response<ApiResponse<List<Category>>> response = apiClient.getRoutes().listCategories().execute();

        assertTrue(response.isSuccessful());
        assertEquals(2, mockWebServer.getRequestCount()); // Retried once on 500
    }

    @Test
    public void testPaginationHasMoreCalculations() {
        Pagination p1 = new Pagination(1, 10, 25, 3);
        PagedResponse<String> response1 = new PagedResponse<>(Collections.emptyList(), p1);
        assertTrue(response1.hasMore());

        Pagination p2 = new Pagination(3, 10, 25, 3);
        PagedResponse<String> response2 = new PagedResponse<>(Collections.emptyList(), p2);
        assertFalse(response2.hasMore());

        PagedResponse<String> responseNoPagination = new PagedResponse<>(Collections.emptyList(), null);
        assertFalse(responseNoPagination.hasMore());
    }
}
