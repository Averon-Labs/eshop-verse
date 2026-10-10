package com.averonlabs.eshopverse.core.storage;

import androidx.annotation.NonNull;

import java.util.Objects;

/**
 * Encapsulates an authentication token and its expiry timestamp.
 * Redacts token value in {@link #toString()} to prevent accidental log or crash report leakage.
 */
public final class AuthToken {

    private final String token;
    private final String expiresAt;

    public AuthToken(@NonNull String token, @NonNull String expiresAt) {
        this.token = Objects.requireNonNull(token, "token cannot be null");
        this.expiresAt = Objects.requireNonNull(expiresAt, "expiresAt cannot be null");
    }

    @NonNull
    public String getToken() {
        return token;
    }

    @NonNull
    public String getExpiresAt() {
        return expiresAt;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        AuthToken that = (AuthToken) o;
        return Objects.equals(token, that.token) &&
                Objects.equals(expiresAt, that.expiresAt);
    }

    @Override
    public int hashCode() {
        return Objects.hash(token, expiresAt);
    }

    @NonNull
    @Override
    public String toString() {
        return "AuthToken{token=[REDACTED], expiresAt='" + expiresAt + "'}";
    }
}
