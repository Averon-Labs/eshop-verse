package com.averonlabs.eshopverse.core.model;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.google.gson.annotations.SerializedName;

import java.util.Objects;

/**
 * InventoryRow model derived from docs/openapi.yaml InventoryRow schema.
 */
public final class InventoryRow {

    @SerializedName("productId")
    private final int productId;

    @SerializedName("name")
    private final String name;

    @SerializedName("sku")
    private final String sku;

    @SerializedName("quantity")
    private final int quantity;

    @SerializedName("inStock")
    private final boolean inStock;

    @SerializedName("updatedAt")
    private final String updatedAt;

    public InventoryRow(int productId, @NonNull String name, @Nullable String sku,
                        int quantity, boolean inStock, @Nullable String updatedAt) {
        this.productId = productId;
        this.name = Objects.requireNonNull(name, "name cannot be null");
        this.sku = sku;
        this.quantity = quantity;
        this.inStock = inStock;
        this.updatedAt = updatedAt;
    }

    public int getProductId() {
        return productId;
    }

    @NonNull
    public String getName() {
        return name;
    }

    @Nullable
    public String getSku() {
        return sku;
    }

    public int getQuantity() {
        return quantity;
    }

    public boolean isInStock() {
        return inStock;
    }

    @Nullable
    public String getUpdatedAt() {
        return updatedAt;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        InventoryRow that = (InventoryRow) o;
        return productId == that.productId &&
                quantity == that.quantity &&
                inStock == that.inStock &&
                Objects.equals(name, that.name) &&
                Objects.equals(sku, that.sku) &&
                Objects.equals(updatedAt, that.updatedAt);
    }

    @Override
    public int hashCode() {
        return Objects.hash(productId, name, sku, quantity, inStock, updatedAt);
    }
}
