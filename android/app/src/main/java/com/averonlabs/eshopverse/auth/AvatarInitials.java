package com.averonlabs.eshopverse.auth;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import java.util.Locale;

/**
 * PRF-001: initials fallback shown when a customer has no profile photo.
 * Kept free of Android types so the behavior is unit-testable on the JVM.
 */
public final class AvatarInitials {

    private AvatarInitials() {
        // Utility class
    }

    /**
     * Returns one or two uppercase initials: the first letter of the first
     * and last names, then the email local part, then a neutral placeholder.
     */
    @NonNull
    public static String from(
            @Nullable String firstName,
            @Nullable String lastName,
            @Nullable String email
    ) {
        String first = firstLetter(firstName);
        String last = firstLetter(lastName);

        if (first != null && last != null) {
            return (first + last).toUpperCase(Locale.ROOT);
        }
        if (first != null) {
            return first.toUpperCase(Locale.ROOT);
        }
        if (last != null) {
            return last.toUpperCase(Locale.ROOT);
        }

        String emailLetter = firstLetter(email);
        if (emailLetter != null) {
            return emailLetter.toUpperCase(Locale.ROOT);
        }

        return "?";
    }

    @Nullable
    private static String firstLetter(@Nullable String value) {
        if (value == null) {
            return null;
        }

        String trimmed = value.trim();
        if (trimmed.isEmpty()) {
            return null;
        }

        int codePoint = trimmed.codePointAt(0);
        if (!Character.isLetterOrDigit(codePoint)) {
            return null;
        }

        return new String(Character.toChars(codePoint));
    }
}
