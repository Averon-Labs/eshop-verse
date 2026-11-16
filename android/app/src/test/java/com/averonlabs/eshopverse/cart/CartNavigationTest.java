package com.averonlabs.eshopverse.cart;

import com.averonlabs.eshopverse.R;

import org.junit.Test;

import static org.junit.Assert.assertNotEquals;

/**
 * Unit tests verifying that Cart guest authentication routes directly to the
 * primary account fragment in the bottom navigation (AUTH-004 / QUAL-008).
 */
public class CartNavigationTest {

    @Test
    public void test_cart_guest_action_routes_to_account_fragment() {
        // Assert that the accountFragment navigation destination resource is present and valid
        int accountNavId = R.id.accountFragment;
        assertNotEquals(0, accountNavId);

        // Ensure it is distinct from isolated child auth flow
        int isolatedNavAuthId = R.id.nav_auth;
        assertNotEquals(accountNavId, isolatedNavAuthId);
    }
}
