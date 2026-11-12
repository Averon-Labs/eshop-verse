package com.averonlabs.eshopverse.core.storage;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertTrue;

import com.averonlabs.eshopverse.core.model.AuthSession;
import com.averonlabs.eshopverse.core.model.User;
import com.averonlabs.eshopverse.core.model.UserRole;
import com.averonlabs.eshopverse.core.model.UserStatus;

import org.junit.Before;
import org.junit.Test;

public class TokenStoreTest {

    private static final String SAMPLE_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.secretpayload";
    private static final String FUTURE_EXPIRY = "2099-01-01T00:00:00Z";
    private static final String PAST_EXPIRY = "2020-01-01T00:00:00Z";

    private InMemoryTokenStore tokenStore;

    @Before
    public void setUp() {
        tokenStore = new InMemoryTokenStore();
    }

    @Test
    public void testEmptyStoreState() {
        assertNull(tokenStore.read());
        assertTrue(tokenStore.isExpired());
        assertNull(tokenStore.getToken());
    }

    @Test
    public void testSaveAndReadToken() {
        tokenStore.save(SAMPLE_TOKEN, FUTURE_EXPIRY);

        AuthToken stored = tokenStore.read();
        assertNotNull(stored);
        assertEquals(SAMPLE_TOKEN, stored.getToken());
        assertEquals(FUTURE_EXPIRY, stored.getExpiresAt());
        assertFalse(tokenStore.isExpired());
        assertEquals(SAMPLE_TOKEN, tokenStore.getToken());
    }

    @Test
    public void testClearOnLogout() {
        tokenStore.save(SAMPLE_TOKEN, FUTURE_EXPIRY);
        assertNotNull(tokenStore.read());

        tokenStore.clear();

        assertNull(tokenStore.read());
        assertTrue(tokenStore.isExpired());
        assertNull(tokenStore.getToken());
    }

    @Test
    public void testExpiryCalculationWithPastDate() {
        tokenStore.save(SAMPLE_TOKEN, PAST_EXPIRY);

        assertTrue("Past expiry must report isExpired() == true", tokenStore.isExpired());
        assertNull("getToken() must return null for expired token", tokenStore.getToken());
        assertNotNull("Raw read() still returns record for auditing before clear()", tokenStore.read());
    }

    @Test
    public void testExpiryWithTimezonesAndFractions() {
        // Test with ISO offset +05:00 in past
        assertTrue(TokenExpirationHelper.isExpired("2015-05-20T10:30:00+05:00", System.currentTimeMillis()));

        // Test with ISO offset in future
        assertFalse(TokenExpirationHelper.isExpired("2099-12-31T23:59:59-05:00", System.currentTimeMillis()));

        // Test with milliseconds fraction in future
        assertFalse(TokenExpirationHelper.isExpired("2099-06-15T12:00:00.000Z", System.currentTimeMillis()));

        // Malformed strings must be treated as expired
        assertTrue(TokenExpirationHelper.isExpired("invalid-date", System.currentTimeMillis()));
        assertTrue(TokenExpirationHelper.isExpired(null, System.currentTimeMillis()));
        assertTrue(TokenExpirationHelper.isExpired("", System.currentTimeMillis()));
    }

    @Test
    public void testRedactionInToStringNeverLeaksToken() {
        AuthToken authToken = new AuthToken(SAMPLE_TOKEN, FUTURE_EXPIRY);
        String authTokenStr = authToken.toString();

        assertFalse("AuthToken.toString() must never contain raw token", authTokenStr.contains(SAMPLE_TOKEN));
        assertTrue("AuthToken.toString() must include [REDACTED]", authTokenStr.contains("[REDACTED]"));

        tokenStore.save(SAMPLE_TOKEN, FUTURE_EXPIRY);
        String storeStr = tokenStore.toString();
        assertFalse("TokenStore.toString() must never contain raw token", storeStr.contains(SAMPLE_TOKEN));

        User user = new User(1, "customer@example.com", "John", "Doe", UserRole.CUSTOMER, UserStatus.ACTIVE, "2026-01-01T00:00:00Z");
        AuthSession session = new AuthSession(SAMPLE_TOKEN, FUTURE_EXPIRY, user);
        String sessionStr = session.toString();
        assertFalse("AuthSession.toString() must never contain raw token", sessionStr.contains(SAMPLE_TOKEN));
        assertTrue("AuthSession.toString() must include [REDACTED]", sessionStr.contains("[REDACTED]"));
    }
}
