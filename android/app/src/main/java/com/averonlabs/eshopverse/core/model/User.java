package com.averonlabs.eshopverse.core.model;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.google.gson.annotations.SerializedName;

import java.util.Objects;

/**
 * User model derived from docs/openapi.yaml User schema.
 */
public final class User {

    @SerializedName("id")
    private final int id;

    @SerializedName("email")
    private final String email;

    @SerializedName("firstName")
    private final String firstName;

    @SerializedName("lastName")
    private final String lastName;

    @SerializedName("role")
    private final UserRole role;

    @SerializedName("status")
    private final UserStatus status;

    @SerializedName("createdAt")
    private final String createdAt;

    @SerializedName("avatarUrl")
    private final String avatarUrl;

    public User(int id, @NonNull String email, @NonNull String firstName, @NonNull String lastName,
                @NonNull UserRole role, @NonNull UserStatus status, @Nullable String createdAt) {
        this(id, email, firstName, lastName, role, status, createdAt, null);
    }

    public User(int id, @NonNull String email, @NonNull String firstName, @NonNull String lastName,
                @NonNull UserRole role, @NonNull UserStatus status, @Nullable String createdAt,
                @Nullable String avatarUrl) {
        this.id = id;
        this.email = email;
        this.firstName = firstName;
        this.lastName = lastName;
        this.role = role;
        this.status = status;
        this.createdAt = createdAt;
        this.avatarUrl = avatarUrl;
    }

    public int getId() {
        return id;
    }

    @NonNull
    public String getEmail() {
        return email;
    }

    @NonNull
    public String getFirstName() {
        return firstName;
    }

    @NonNull
    public String getLastName() {
        return lastName;
    }

    @NonNull
    public String getFullName() {
        return firstName + " " + lastName;
    }

    @NonNull
    public UserRole getRole() {
        return role;
    }

    @NonNull
    public UserStatus getStatus() {
        return status;
    }

    @Nullable
    public String getCreatedAt() {
        return createdAt;
    }

    /**
     * Absolute URL of the customer's profile photo, or null when none is set.
     * Served by the public media capability route (PRF-001).
     */
    @Nullable
    public String getAvatarUrl() {
        return avatarUrl;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        User user = (User) o;
        return id == user.id &&
                Objects.equals(email, user.email) &&
                Objects.equals(firstName, user.firstName) &&
                Objects.equals(lastName, user.lastName) &&
                role == user.role &&
                status == user.status &&
                Objects.equals(avatarUrl, user.avatarUrl);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id, email, firstName, lastName, role, status, avatarUrl);
    }
}
