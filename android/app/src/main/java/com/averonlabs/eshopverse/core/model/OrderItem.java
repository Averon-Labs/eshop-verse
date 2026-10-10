package com.averonlabs.eshopverse.core.model;

import androidx.annotation.NonNull;

import com.averonlabs.eshopverse.core.money.Money;
import com.google.gson.annotations.SerializedName;

import java.util.Objects;

/**
 * OrderItem model derived from docs/openapi.yaml OrderItem schema.
 */
public final class OrderItem {

    @SerializedName("productId")
    private final int productId;

    @SerializedName("productName")
    private final String productName;

    @SerializedName("quantity")
    private final int quantity;

    @SerializedName("unitPrice")
    private final String unitPrice;

    @SerializedName("lineTotal")
    private final String lineTotal;

    public OrderItem(int productId, @NonNull String productName, int quantity,
                     @NonNull String unitPrice, @NonNull String lineTotal) {
        this.productId = productId;
        this.productName = Objects.requireNonNull(productName, "productName cannot be null");
        this.quantity = quantity;
        this.unitPrice = Objects.requireNonNull(unitPrice, "unitPrice cannot be null");
        this.lineTotal = Objects.requireNonNull(lineTotal, "lineTotal cannot be null");
    }

    public int getProductId() {
        return productId;
    }

    @NonNull
    public String getProductName() {
        return productName;
    }

    public int getQuantity() {
        return quantity;
    }

    @NonNull
    public String getUnitPrice() {
        return unitPrice;
    }

    @NonNull
    public Money getUnitPriceMoney() {
        return Money.parse(unitPrice);
    }

    @NonNull
    public String getLineTotal() {
        return lineTotal;
    }

    @NonNull
    public Money getLineTotalMoney() {
        return Money.parse(lineTotal);
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        OrderItem orderItem = (OrderItem) o;
        return productId == orderItem.productId &&
                quantity == orderItem.quantity &&
                Objects.equals(productName, orderItem.productName) &&
                Objects.equals(unitPrice, orderItem.unitPrice) &&
                Objects.equals(lineTotal, orderItem.lineTotal);
    }

    @Override
    public int hashCode() {
        return Objects.hash(productId, productName, quantity, unitPrice, lineTotal);
    }
}
