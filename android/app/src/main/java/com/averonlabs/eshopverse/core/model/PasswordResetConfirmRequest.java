package com.averonlabs.eshopverse.core.model;

import androidx.annotation.NonNull;

import com.google.gson.annotations.SerializedName;

import java.util.Objects;

/**
 * Request payload for confirming password reset (POST /auth/password-reset/confirm).
 */
public final class PasswordResetConfirmRequest {

    @SerializedName("email")
    private final String email;

    @SerializedName("token")
    private final String token;

    @SerializedName("password")
    private final String password;

    public PasswordResetConfirmRequest(@NonNull String email, @NonNull String token, @NonNull String password) {
        this.email = Objects.requireNonNull(email, "email cannot be null");
        this.token = Objects.requireNonNull(token, "token cannot be null");
        this.password = Objects.requireNonNull(password, "password cannot be null");
    }

    @NonNull
    public String getEmail() {
        return email;
    }

    @NonNull
    public String getToken() {
        return token;
    }

    @NonNull
    public String getPassword() {
        return password;
    }

    @NonNull
    @Override
    public String toString() {
        return "PasswordResetConfirmRequest{email='" + email + "', token=[REDACTED], password=[REDACTED]}";
    }
}
