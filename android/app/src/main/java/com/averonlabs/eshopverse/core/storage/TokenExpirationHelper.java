package com.averonlabs.eshopverse.core.storage;

import androidx.annotation.Nullable;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;
import java.util.TimeZone;

/**
 * Utility for parsing ISO-8601 date-time strings and checking token expiration.
 * Compatible with Android API 25+ without requiring desugaring libraries.
 */
public final class TokenExpirationHelper {

    private TokenExpirationHelper() {}

    /**
     * Determines whether the given ISO-8601 timestamp is expired compared to the current epoch time.
     *
     * @param expiresAt          ISO-8601 string (e.g., "2026-11-10T12:00:00Z").
     * @param currentEpochMillis Current timestamp in epoch milliseconds.
     * @return true if the timestamp is null, empty, unparseable, or <= currentEpochMillis.
     */
    public static boolean isExpired(@Nullable String expiresAt, long currentEpochMillis) {
        if (expiresAt == null || expiresAt.trim().isEmpty()) {
            return true;
        }

        long expiryMillis = parseIso8601(expiresAt);
        if (expiryMillis <= 0) {
            return true;
        }

        return currentEpochMillis >= expiryMillis;
    }

    /**
     * Parses an ISO-8601 string into epoch milliseconds.
     *
     * @param isoString The ISO-8601 formatted date-time string.
     * @return Epoch milliseconds, or -1 if parsing failed.
     */
    public static long parseIso8601(@Nullable String isoString) {
        if (isoString == null) {
            return -1;
        }
        String s = isoString.trim();
        if (s.isEmpty()) {
            return -1;
        }

        // Normalize UTC "Z" or "+HH:MM" to RFC 822 format "+HHmm"
        if (s.endsWith("Z")) {
            s = s.substring(0, s.length() - 1) + "+0000";
        } else if (s.length() >= 6 && (s.charAt(s.length() - 3) == ':')
                && (s.charAt(s.length() - 6) == '+' || s.charAt(s.length() - 6) == '-')) {
            s = s.substring(0, s.length() - 3) + s.substring(s.length() - 2);
        }

        String pattern;
        if (s.contains(".")) {
            pattern = "yyyy-MM-dd'T'HH:mm:ss.SSSZ";
        } else {
            pattern = "yyyy-MM-dd'T'HH:mm:ssZ";
        }

        try {
            SimpleDateFormat sdf = new SimpleDateFormat(pattern, Locale.US);
            sdf.setTimeZone(TimeZone.getTimeZone("UTC"));
            Date date = sdf.parse(s);
            return date != null ? date.getTime() : -1;
        } catch (ParseException e) {
            try {
                SimpleDateFormat fallbackSdf = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.US);
                fallbackSdf.setTimeZone(TimeZone.getTimeZone("UTC"));
                Date date = fallbackSdf.parse(s);
                return date != null ? date.getTime() : -1;
            } catch (ParseException ex) {
                return -1;
            }
        }
    }
}
