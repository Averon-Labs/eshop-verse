package com.averonlabs.eshopverse.core.model;

import androidx.annotation.NonNull;

import com.google.gson.annotations.SerializedName;

import java.util.Objects;

/**
 * Category model derived from docs/openapi.yaml Category schema.
 */
public final class Category {

    @SerializedName("id")
    private final int id;

    @SerializedName("name")
    private final String name;

    @SerializedName("sortOrder")
    private final int sortOrder;

    @SerializedName("status")
    private final CategoryStatus status;

    public Category(int id, @NonNull String name, int sortOrder, @NonNull CategoryStatus status) {
        this.id = id;
        this.name = Objects.requireNonNull(name, "name cannot be null");
        this.sortOrder = sortOrder;
        this.status = Objects.requireNonNull(status, "status cannot be null");
    }

    public int getId() {
        return id;
    }

    @NonNull
    public String getName() {
        return name;
    }

    public int getSortOrder() {
        return sortOrder;
    }

    @NonNull
    public CategoryStatus getStatus() {
        return status;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Category category = (Category) o;
        return id == category.id &&
                sortOrder == category.sortOrder &&
                Objects.equals(name, category.name) &&
                status == category.status;
    }

    @Override
    public int hashCode() {
        return Objects.hash(id, name, sortOrder, status);
    }
}
