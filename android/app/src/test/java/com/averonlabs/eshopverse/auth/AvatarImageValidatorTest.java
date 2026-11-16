package com.averonlabs.eshopverse.auth;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertTrue;

import org.junit.Test;

/**
 * PRF-001: unit tests for the client-side avatar guard. The declared MIME
 * type never decides; the magic bytes do.
 */
public class AvatarImageValidatorTest {

    private static final byte[] PNG = {
            (byte) 0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A,
            0x00, 0x00, 0x00, 0x0D
    };

    private static final byte[] JPEG = {
            (byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0,
            0x00, 0x10, 'J', 'F', 'I', 'F', 0x00, 0x01
    };

    private static final byte[] WEBP = {
            'R', 'I', 'F', 'F', 0x24, 0x00, 0x00, 0x00,
            'W', 'E', 'B', 'P'
    };

    @Test
    public void test_detect_mime_type_recognizes_png_jpeg_and_webp() {
        assertEquals(AvatarImageValidator.MIME_PNG, AvatarImageValidator.detectMimeType(PNG));
        assertEquals(AvatarImageValidator.MIME_JPEG, AvatarImageValidator.detectMimeType(JPEG));
        assertEquals(AvatarImageValidator.MIME_WEBP, AvatarImageValidator.detectMimeType(WEBP));
    }

    @Test
    public void test_detect_mime_type_rejects_a_renamed_script() {
        byte[] script = "<?php echo 'not an image';".getBytes(java.nio.charset.StandardCharsets.UTF_8);

        assertNull(AvatarImageValidator.detectMimeType(script));
        assertNull(AvatarImageValidator.detectMimeType(null));
        assertNull(AvatarImageValidator.detectMimeType(new byte[]{0x00, 0x01}));
    }

    @Test
    public void test_size_limit_is_five_megabytes_inclusive() {
        assertTrue(AvatarImageValidator.isWithinSizeLimit(1));
        assertTrue(AvatarImageValidator.isWithinSizeLimit(AvatarImageValidator.MAX_BYTES));
        assertFalse(AvatarImageValidator.isWithinSizeLimit(AvatarImageValidator.MAX_BYTES + 1));
        assertFalse(AvatarImageValidator.isWithinSizeLimit(0));
    }

    @Test
    public void test_file_name_follows_the_detected_mime_type() {
        assertEquals("avatar.png", AvatarImageValidator.fileNameForMimeType(AvatarImageValidator.MIME_PNG));
        assertEquals("avatar.webp", AvatarImageValidator.fileNameForMimeType(AvatarImageValidator.MIME_WEBP));
        assertEquals("avatar.jpg", AvatarImageValidator.fileNameForMimeType(AvatarImageValidator.MIME_JPEG));
        assertEquals("avatar.jpg", AvatarImageValidator.fileNameForMimeType(null));
    }

    @Test
    public void test_supported_mime_types_are_exactly_the_contract_types() {
        assertTrue(AvatarImageValidator.isSupportedMimeType(AvatarImageValidator.MIME_PNG));
        assertTrue(AvatarImageValidator.isSupportedMimeType(AvatarImageValidator.MIME_JPEG));
        assertTrue(AvatarImageValidator.isSupportedMimeType(AvatarImageValidator.MIME_WEBP));
        assertFalse(AvatarImageValidator.isSupportedMimeType("application/x-php"));
        assertFalse(AvatarImageValidator.isSupportedMimeType(null));
    }
}
