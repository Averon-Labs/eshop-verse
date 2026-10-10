package com.averonlabs.eshopverse.core.storage;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

/**
 * Interface for token storage.
 * All implementations must protect token data, exclude it from device backups,
 * and ensure tokens are never logged or exposed in {@link #toString()}.
 */
public interface TokenStore {

    /**
     * Saves the token and its absolute expiry timestamp.
     *
     * @param token     The bearer authentication token.
     * @param expiresAt The ISO-8601 expiry timestamp.
     */
    void save(@NonNull String token, @NonNull String expiresAt);

    /**
     * Reads the stored authentication token data.
     *
     * @return The stored {@link AuthToken}, or null if no token is saved.
     */
    @Nullable
    AuthToken read();

    /**
     * Clears any saved token (e.g. on user sign-out, session invalidation, or 401).
     */
    void clear();

    /**
     * Checks if the stored token has expired or if no token exists.
     *
     * @return true if no token exists or if the token is past its expiry date.
     */
    boolean isExpired();

    /**
     * Convenience method to retrieve just the raw token string.
     *
     * @return The token string if present and valid, or null if absent or expired.
     */
    @Nullable
    String getToken();
}
