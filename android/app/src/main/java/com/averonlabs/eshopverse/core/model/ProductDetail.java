package com.averonlabs.eshopverse.core.model;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.google.gson.annotations.SerializedName;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Objects;

/**
 * ProductDetail model derived from docs/openapi.yaml ProductDetail schema.
 */
public class ProductDetail extends ProductSummary {

    @SerializedName("description")
    private final String description;

    @SerializedName("sku")
    private final String sku;

    @SerializedName("stockQuantity")
    private final int stockQuantity;

    @SerializedName("images")
    private final List<ProductImage> images;

    public ProductDetail(int id, @NonNull String name, @NonNull String price, @NonNull Currency currency,
                         @Nullable Integer categoryId, @Nullable String categoryName,
                         @Nullable String imageUrl, boolean inStock, @Nullable ProductStatus status,
                         @Nullable String description, @Nullable String sku, int stockQuantity,
                         @Nullable List<ProductImage> images) {
        super(id, name, price, currency, categoryId, categoryName, imageUrl, inStock, status);
        this.description = description;
        this.sku = sku;
        this.stockQuantity = stockQuantity;
        this.images = images != null ? Collections.unmodifiableList(new ArrayList<>(images)) : Collections.emptyList();
    }

    @Nullable
    public String getDescription() {
        return description;
    }

    @Nullable
    public String getSku() {
        return sku;
    }

    public int getStockQuantity() {
        return stockQuantity;
    }

    @NonNull
    public List<ProductImage> getImages() {
        return images;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        if (!super.equals(o)) return false;
        ProductDetail that = (ProductDetail) o;
        return stockQuantity == that.stockQuantity &&
                Objects.equals(description, that.description) &&
                Objects.equals(sku, that.sku) &&
                Objects.equals(images, that.images);
    }

    @Override
    public int hashCode() {
        return Objects.hash(super.hashCode(), description, sku, stockQuantity, images);
    }
}
