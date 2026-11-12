package com.averonlabs.eshopverse.core.model;

import androidx.annotation.NonNull;

import com.google.gson.annotations.SerializedName;

import java.util.Objects;

/**
 * Request payload for customer login (POST /auth/login).
 */
public final class LoginRequest {

    @SerializedName("email")
    private final String email;

    @SerializedName("password")
    private final String password;

    public LoginRequest(@NonNull String email, @NonNull String password) {
        this.email = Objects.requireNonNull(email, "email cannot be null");
        this.password = Objects.requireNonNull(password, "password cannot be null");
    }

    @NonNull
    public String getEmail() {
        return email;
    }

    @NonNull
    public String getPassword() {
        return password;
    }

    @NonNull
    @Override
    public String toString() {
        return "LoginRequest{email='" + email + "', password=[REDACTED]}";
    }
}
