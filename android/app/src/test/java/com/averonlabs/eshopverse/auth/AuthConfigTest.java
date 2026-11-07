package com.averonlabs.eshopverse.auth;

import com.averonlabs.eshopverse.BuildConfig;

import org.junit.Test;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;

/**
 * Pins the Google Web client ID that Credential Manager uses as its server
 * client ID.
 *
 * <p>The Web client and the Android OAuth client registered for
 * {@code com.averonlabs.eshopverse} must live in the same Google Cloud
 * project. Pointing the app at another project's Web client makes Google look
 * for the Android client in the wrong project, so it never issues an ID token
 * and every Google sign-in fails before the API is contacted.</p>
 */
public class AuthConfigTest {

    private static final String ESHOP_VERSE_WEB_CLIENT_ID =
            "629866052539-50edn5o2jbjg449u5pjui72bnm4atojo.apps.googleusercontent.com";

    @Test
    public void test_google_web_client_id_uses_the_eshop_verse_project() {
        assertEquals(ESHOP_VERSE_WEB_CLIENT_ID, BuildConfig.GOOGLE_WEB_CLIENT_ID);
    }

    @Test
    public void test_google_web_client_id_is_a_web_application_client() {
        assertTrue(BuildConfig.GOOGLE_WEB_CLIENT_ID.endsWith(".apps.googleusercontent.com"));
    }
}
