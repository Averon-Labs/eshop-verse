package com.averonlabs.eshopverse.core.model;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertTrue;

import com.averonlabs.eshopverse.core.money.Money;
import com.google.gson.Gson;

import org.junit.Test;

import java.lang.reflect.Field;
import java.util.Collections;

public class ApiModelParsingTest {

    private final Gson gson = new Gson();

    @Test
    public void testUserJsonParsing() {
        String json = "{\n" +
                "  \"id\": 42,\n" +
                "  \"email\": \"alex@example.com\",\n" +
                "  \"firstName\": \"Alex\",\n" +
                "  \"lastName\": \"Rivera\",\n" +
                "  \"role\": \"customer\",\n" +
                "  \"status\": \"active\",\n" +
                "  \"createdAt\": \"2026-03-30T12:00:00Z\"\n" +
                "}";

        User user = gson.fromJson(json, User.class);
        assertEquals(42, user.getId());
        assertEquals("alex@example.com", user.getEmail());
        assertEquals("Alex", user.getFirstName());
        assertEquals("Rivera", user.getLastName());
        assertEquals(UserRole.CUSTOMER, user.getRole());
        assertEquals(UserStatus.ACTIVE, user.getStatus());
        assertEquals("Alex Rivera", user.getFullName());
    }

    @Test
    public void testAuthSessionJsonParsing() {
        String json = "{\n" +
                "  \"token\": \"sanctum_token_123\",\n" +
                "  \"expiresAt\": \"2026-04-30T12:00:00Z\",\n" +
                "  \"user\": {\n" +
                "    \"id\": 1,\n" +
                "    \"email\": \"user@example.com\",\n" +
                "    \"firstName\": \"John\",\n" +
                "    \"lastName\": \"Doe\",\n" +
                "    \"role\": \"customer\",\n" +
                "    \"status\": \"active\"\n" +
                "  }\n" +
                "}";

        AuthSession session = gson.fromJson(json, AuthSession.class);
        assertEquals("sanctum_token_123", session.getToken());
        assertEquals(1, session.getUser().getId());
    }

    @Test
    public void testProductDetailAndMoneyFieldIsString() throws Exception {
        String json = "{\n" +
                "  \"id\": 10,\n" +
                "  \"name\": \"Classic Runner\",\n" +
                "  \"price\": \"19.99\",\n" +
                "  \"currency\": \"USD\",\n" +
                "  \"categoryId\": 3,\n" +
                "  \"categoryName\": \"Footwear\",\n" +
                "  \"imageUrl\": \"https://images.example.com/p1.jpg\",\n" +
                "  \"inStock\": true,\n" +
                "  \"status\": \"active\",\n" +
                "  \"description\": \"Comfortable running shoes\",\n" +
                "  \"sku\": \"RUN-001\",\n" +
                "  \"stockQuantity\": 15,\n" +
                "  \"images\": [\n" +
                "    {\"url\": \"https://images.example.com/p1.jpg\", \"sortOrder\": 0}\n" +
                "  ]\n" +
                "}";

        ProductDetail detail = gson.fromJson(json, ProductDetail.class);
        assertEquals("19.99", detail.getPrice());
        assertEquals(Money.parse("19.99"), detail.getPriceMoney());

        // Assert strictly via reflection that price field in ProductSummary is java.lang.String and not double/float
        Field priceField = ProductSummary.class.getDeclaredField("price");
        assertEquals("Price field must be String in model layer", String.class, priceField.getType());
    }

    @Test
    public void testCartAndCartItemParsing() {
        String json = "{\n" +
                "  \"items\": [\n" +
                "    {\n" +
                "      \"productId\": 10,\n" +
                "      \"name\": \"Classic Runner\",\n" +
                "      \"imageUrl\": \"https://images.example.com/p1.jpg\",\n" +
                "      \"unitPrice\": \"19.99\",\n" +
                "      \"currency\": \"USD\",\n" +
                "      \"quantity\": 2,\n" +
                "      \"lineTotal\": \"39.98\",\n" +
                "      \"inStock\": true,\n" +
                "      \"availableQuantity\": 10,\n" +
                "      \"priceChanged\": false,\n" +
                "      \"unavailable\": false\n" +
                "    }\n" +
                "  ],\n" +
                "  \"itemCount\": 2,\n" +
                "  \"subtotal\": \"39.98\",\n" +
                "  \"shipping\": \"5.00\",\n" +
                "  \"total\": \"44.98\",\n" +
                "  \"currency\": \"USD\",\n" +
                "  \"hasIssues\": false\n" +
                "}";

        Cart cart = gson.fromJson(json, Cart.class);
        assertEquals(1, cart.getItems().size());
        assertEquals(2, cart.getItemCount());
        assertEquals("39.98", cart.getSubtotal());
        assertEquals("5.00", cart.getShipping());
        assertEquals("44.98", cart.getTotal());
        assertEquals(Money.parse("44.98"), cart.getTotalMoney());
        assertFalse(cart.hasIssues());
    }

    @Test
    public void testOrderAndOrderSummaryParsing() {
        String json = "{\n" +
                "  \"id\": 101,\n" +
                "  \"reference\": \"ESV-123456\",\n" +
                "  \"status\": \"confirmed\",\n" +
                "  \"paymentStatus\": \"completed\",\n" +
                "  \"items\": [\n" +
                "    {\n" +
                "      \"productId\": 10,\n" +
                "      \"productName\": \"Classic Runner\",\n" +
                "      \"quantity\": 1,\n" +
                "      \"unitPrice\": \"19.99\",\n" +
                "      \"lineTotal\": \"19.99\"\n" +
                "    }\n" +
                "  ],\n" +
                "  \"subtotal\": \"19.99\",\n" +
                "  \"shipping\": \"5.00\",\n" +
                "  \"total\": \"24.99\",\n" +
                "  \"currency\": \"USD\",\n" +
                "  \"shippingAddress\": {\n" +
                "    \"recipientName\": \"John Doe\",\n" +
                "    \"line1\": \"123 Main St\",\n" +
                "    \"city\": \"Springfield\",\n" +
                "    \"region\": \"IL\",\n" +
                "    \"postalCode\": \"62701\",\n" +
                "    \"country\": \"US\"\n" +
                "  },\n" +
                "  \"timeline\": [\n" +
                "    {\"status\": \"pending_payment\", \"at\": \"2026-03-30T10:00:00Z\"},\n" +
                "    {\"status\": \"confirmed\", \"at\": \"2026-03-30T10:05:00Z\"}\n" +
                "  ],\n" +
                "  \"createdAt\": \"2026-03-30T10:00:00Z\",\n" +
                "  \"updatedAt\": \"2026-03-30T10:05:00Z\"\n" +
                "}";

        Order order = gson.fromJson(json, Order.class);
        assertEquals(101, order.getId());
        assertEquals("ESV-123456", order.getReference());
        assertEquals(OrderStatus.CONFIRMED, order.getStatus());
        assertEquals(PaymentStatus.COMPLETED, order.getPaymentStatus());
        assertEquals(2, order.getTimeline().size());
        assertEquals(Money.parse("24.99"), order.getTotalMoney());
    }

    @Test
    public void testErrorEnvelopeParsing() {
        String json = "{\n" +
                "  \"error\": {\n" +
                "    \"code\": \"VALIDATION_ERROR\",\n" +
                "    \"message\": \"One or more fields are invalid.\",\n" +
                "    \"details\": [\n" +
                "      {\"field\": \"email\", \"message\": \"Email format is invalid.\"}\n" +
                "    ]\n" +
                "  }\n" +
                "}";

        ErrorEnvelope envelope = gson.fromJson(json, ErrorEnvelope.class);
        assertNotNull(envelope.getError());
        assertEquals("VALIDATION_ERROR", envelope.getError().getCode());
        assertEquals(1, envelope.getError().getDetails().size());
        assertEquals("email", envelope.getError().getDetails().get(0).getField());
    }
}
