package com.averonlabs.eshopverse.auth;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

/**
 * PRF-001: client-side guard for profile-photo uploads.
 *
 * <p>The server validates the detected content type and dimensions, but the
 * app checks the magic bytes first so an unsupported or huge file never
 * travels over the network. The declared MIME type is informational only:
 * the bytes decide what the file is.</p>
 */
public final class AvatarImageValidator {

    /** Matches the contract's 5 MB upload ceiling. */
    public static final int MAX_BYTES = 5 * 1024 * 1024;

    public static final String MIME_JPEG = "image/jpeg";
    public static final String MIME_PNG = "image/png";
    public static final String MIME_WEBP = "image/webp";

    private AvatarImageValidator() {
        // Utility class
    }

    /** Whether the file fits the contract's upload ceiling. */
    public static boolean isWithinSizeLimit(int byteCount) {
        return byteCount > 0 && byteCount <= MAX_BYTES;
    }

    /**
     * Detects a supported image type from its magic bytes.
     *
     * @return {@link #MIME_JPEG}, {@link #MIME_PNG}, {@link #MIME_WEBP}, or
     *         null when the bytes are not a supported image.
     */
    @Nullable
    public static String detectMimeType(@Nullable byte[] bytes) {
        if (bytes == null || bytes.length < 12) {
            return null;
        }

        if ((bytes[0] & 0xFF) == 0xFF && (bytes[1] & 0xFF) == 0xD8 && (bytes[2] & 0xFF) == 0xFF) {
            return MIME_JPEG;
        }

        if ((bytes[0] & 0xFF) == 0x89 && bytes[1] == 'P' && bytes[2] == 'N' && bytes[3] == 'G'
                && (bytes[4] & 0xFF) == 0x0D && (bytes[5] & 0xFF) == 0x0A
                && (bytes[6] & 0xFF) == 0x1A && (bytes[7] & 0xFF) == 0x0A) {
            return MIME_PNG;
        }

        if (bytes[0] == 'R' && bytes[1] == 'I' && bytes[2] == 'F' && bytes[3] == 'F'
                && bytes[8] == 'W' && bytes[9] == 'E' && bytes[10] == 'B' && bytes[11] == 'P') {
            return MIME_WEBP;
        }

        return null;
    }

    /** Whether the declared type is one the contract accepts. */
    public static boolean isSupportedMimeType(@Nullable String mimeType) {
        return MIME_JPEG.equals(mimeType)
                || MIME_PNG.equals(mimeType)
                || MIME_WEBP.equals(mimeType);
    }

    /** Extension used in the multipart file name for a supported MIME type. */
    @NonNull
    public static String fileNameForMimeType(@Nullable String mimeType) {
        if (MIME_PNG.equals(mimeType)) {
            return "avatar.png";
        }
        if (MIME_WEBP.equals(mimeType)) {
            return "avatar.webp";
        }
        return "avatar.jpg";
    }
}
