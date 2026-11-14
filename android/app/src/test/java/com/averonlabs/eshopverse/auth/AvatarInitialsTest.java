package com.averonlabs.eshopverse.auth;

import static org.junit.Assert.assertEquals;

import org.junit.Test;

/**
 * PRF-001: initials fallback behavior for customers without a photo.
 */
public class AvatarInitialsTest {

    @Test
    public void test_initials_use_first_and_last_name() {
        assertEquals("JD", AvatarInitials.from("Jane", "Doe", "jane@example.com"));
    }

    @Test
    public void test_initials_use_the_available_name_and_handle_unicode() {
        assertEquals("J", AvatarInitials.from("jane", "  ", "jane@example.com"));
        assertEquals("É", AvatarInitials.from("élodie", null, null));
    }

    @Test
    public void test_initials_fall_back_to_the_email_then_a_placeholder() {
        assertEquals("A", AvatarInitials.from(null, "", "ada@example.com"));
        assertEquals("?", AvatarInitials.from(null, null, null));
        assertEquals("?", AvatarInitials.from("  ", "  ", "  "));
    }
}
