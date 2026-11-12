package com.averonlabs.eshopverse.core.model;

import androidx.annotation.Nullable;

import com.google.gson.annotations.SerializedName;

/**
 * Request payload for customer profile updates (PATCH /auth/profile).
 */
public final class UpdateProfileRequest {

    @SerializedName("firstName")
    private final String firstName;

    @SerializedName("lastName")
    private final String lastName;

    public UpdateProfileRequest(@Nullable String firstName, @Nullable String lastName) {
        this.firstName = firstName;
        this.lastName = lastName;
    }

    @Nullable
    public String getFirstName() {
        return firstName;
    }

    @Nullable
    public String getLastName() {
        return lastName;
    }
}
