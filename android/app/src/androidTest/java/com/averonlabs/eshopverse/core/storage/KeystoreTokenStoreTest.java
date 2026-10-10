package com.averonlabs.eshopverse.core.storage;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertTrue;

import android.content.Context;
import android.content.SharedPreferences;

import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;

import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;

@RunWith(AndroidJUnit4.class)
public class KeystoreTokenStoreTest {

    private static final String TEST_TOKEN = "test.jwt.token.value.with.entropy.123456789";
    private static final String FUTURE_EXPIRY = "2099-01-01T00:00:00Z";
    private static final String PAST_EXPIRY = "2020-01-01T00:00:00Z";

    private Context context;
    private KeystoreTokenStore tokenStore;

    @Before
    public void setUp() {
        context = InstrumentationRegistry.getInstrumentation().getTargetContext();
        tokenStore = new KeystoreTokenStore(context);
        tokenStore.clear();
    }

    @After
    public void tearDown() {
        if (tokenStore != null) {
            tokenStore.clear();
        }
    }

    @Test
    public void testKeystoreEncryptionAndDecryptionRoundtrip() {
        tokenStore.save(TEST_TOKEN, FUTURE_EXPIRY);

        AuthToken stored = tokenStore.read();
        assertNotNull("Stored token should not be null after save", stored);
        assertEquals(TEST_TOKEN, stored.getToken());
        assertEquals(FUTURE_EXPIRY, stored.getExpiresAt());
        assertFalse(tokenStore.isExpired());
        assertEquals(TEST_TOKEN, tokenStore.getToken());
    }

    @Test
    public void testPlaintextTokenIsNotStoredInSharedPreferences() {
        tokenStore.save(TEST_TOKEN, FUTURE_EXPIRY);

        SharedPreferences prefs = context.getSharedPreferences("eshopverse_secure_tokens", Context.MODE_PRIVATE);
        String rawCipher = prefs.getString("pref_key_token_cipher", null);
        String rawIv = prefs.getString("pref_key_token_iv", null);

        assertNotNull("Ciphertext should be present in preferences", rawCipher);
        assertNotNull("IV should be present in preferences", rawIv);

        assertFalse("Ciphertext preference must not contain plaintext token", rawCipher.contains(TEST_TOKEN));

        // Scan all preference entries to verify zero plaintext leakage
        for (Object value : prefs.getAll().values()) {
            if (value instanceof String) {
                assertFalse("No preference entry may contain plaintext token", ((String) value).contains(TEST_TOKEN));
            }
        }
    }

    @Test
    public void testClearOnLogoutRemovesCredentials() {
        tokenStore.save(TEST_TOKEN, FUTURE_EXPIRY);
        assertNotNull(tokenStore.read());

        tokenStore.clear();

        assertNull("read() must be null after clear()", tokenStore.read());
        assertTrue("isExpired() must be true after clear()", tokenStore.isExpired());
        assertNull("getToken() must be null after clear()", tokenStore.getToken());
    }

    @Test
    public void testExpiredTokenReturnsNullToken() {
        tokenStore.save(TEST_TOKEN, PAST_EXPIRY);

        assertTrue("Token with past date must report isExpired() == true", tokenStore.isExpired());
        assertNull("getToken() must return null for expired credentials", tokenStore.getToken());
    }

    @Test
    public void testToStringNeverExposesToken() {
        tokenStore.save(TEST_TOKEN, FUTURE_EXPIRY);
        String output = tokenStore.toString();

        assertFalse("KeystoreTokenStore.toString() must never contain raw token", output.contains(TEST_TOKEN));
    }
}
