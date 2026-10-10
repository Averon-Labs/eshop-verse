package com.averonlabs.eshopverse.core.model;

import androidx.annotation.NonNull;

import com.google.gson.annotations.SerializedName;

import java.util.Objects;

/**
 * ProductImage model derived from docs/openapi.yaml ProductImage schema.
 */
public final class ProductImage {

    @SerializedName("url")
    private final String url;

    @SerializedName("sortOrder")
    private final int sortOrder;

    public ProductImage(@NonNull String url, int sortOrder) {
        this.url = Objects.requireNonNull(url, "url cannot be null");
        this.sortOrder = sortOrder;
    }

    @NonNull
    public String getUrl() {
        return url;
    }

    public int getSortOrder() {
        return sortOrder;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        ProductImage that = (ProductImage) o;
        return sortOrder == that.sortOrder && Objects.equals(url, that.url);
    }

    @Override
    public int hashCode() {
        return Objects.hash(url, sortOrder);
    }
}
