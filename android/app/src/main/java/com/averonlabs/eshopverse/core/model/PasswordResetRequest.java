package com.averonlabs.eshopverse.core.model;

import androidx.annotation.NonNull;

import com.google.gson.annotations.SerializedName;

import java.util.Objects;

/**
 * Request payload for requesting a password reset email (POST /auth/password-reset).
 */
public final class PasswordResetRequest {

    @SerializedName("email")
    private final String email;

    public PasswordResetRequest(@NonNull String email) {
        this.email = Objects.requireNonNull(email, "email cannot be null");
    }

    @NonNull
    public String getEmail() {
        return email;
    }
}
