package com.averonlabs.eshopverse.auth;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;

import org.junit.Test;

/**
 * Unit tests verifying Instagram-grade avatar compression constants and contracts.
 */
public class AvatarImageCompressorTest {

    @Test
    public void test_default_constants_match_instagram_pipeline() {
        assertEquals(512, AvatarImageCompressor.DEFAULT_MAX_DIMENSION);
        assertEquals(85, AvatarImageCompressor.DEFAULT_JPEG_QUALITY);
    }
}
