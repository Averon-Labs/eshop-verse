package com.averonlabs.eshopverse.core.model;

import androidx.annotation.NonNull;

import com.google.gson.annotations.SerializedName;

import java.util.Objects;

/**
 * AuthSession model derived from docs/openapi.yaml AuthSession schema.
 */
public final class AuthSession {

    @SerializedName("token")
    private final String token;

    @SerializedName("expiresAt")
    private final String expiresAt;

    @SerializedName("user")
    private final User user;

    public AuthSession(@NonNull String token, @NonNull String expiresAt, @NonNull User user) {
        this.token = Objects.requireNonNull(token, "token cannot be null");
        this.expiresAt = Objects.requireNonNull(expiresAt, "expiresAt cannot be null");
        this.user = Objects.requireNonNull(user, "user cannot be null");
    }

    @NonNull
    public String getToken() {
        return token;
    }

    @NonNull
    public String getExpiresAt() {
        return expiresAt;
    }

    @NonNull
    public User getUser() {
        return user;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        AuthSession that = (AuthSession) o;
        return Objects.equals(token, that.token) &&
                Objects.equals(expiresAt, that.expiresAt) &&
                Objects.equals(user, that.user);
    }

    @Override
    public int hashCode() {
        return Objects.hash(token, expiresAt, user);
    }
}
