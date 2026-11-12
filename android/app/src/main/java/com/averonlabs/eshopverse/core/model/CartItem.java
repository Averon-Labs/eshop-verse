package com.averonlabs.eshopverse.core.model;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.averonlabs.eshopverse.core.money.Money;
import com.google.gson.annotations.SerializedName;

import java.util.Objects;

/**
 * CartItem model derived from docs/openapi.yaml CartItem schema.
 */
public final class CartItem {

    @SerializedName("productId")
    private final int productId;

    @SerializedName("name")
    private final String name;

    @SerializedName("imageUrl")
    private final String imageUrl;

    @SerializedName("unitPrice")
    private final String unitPrice;

    @SerializedName("currency")
    private final Currency currency;

    @SerializedName("quantity")
    private final int quantity;

    @SerializedName("lineTotal")
    private final String lineTotal;

    @SerializedName("inStock")
    private final boolean inStock;

    @SerializedName("availableQuantity")
    private final int availableQuantity;

    @SerializedName("priceChanged")
    private final boolean priceChanged;

    @SerializedName("unavailable")
    private final boolean unavailable;

    public CartItem(int productId, @NonNull String name, @Nullable String imageUrl,
                    @NonNull String unitPrice, @NonNull Currency currency, int quantity,
                    @NonNull String lineTotal, boolean inStock, int availableQuantity,
                    boolean priceChanged, boolean unavailable) {
        this.productId = productId;
        this.name = Objects.requireNonNull(name, "name cannot be null");
        this.imageUrl = imageUrl;
        this.unitPrice = Objects.requireNonNull(unitPrice, "unitPrice cannot be null");
        this.currency = Objects.requireNonNull(currency, "currency cannot be null");
        this.quantity = quantity;
        this.lineTotal = Objects.requireNonNull(lineTotal, "lineTotal cannot be null");
        this.inStock = inStock;
        this.availableQuantity = availableQuantity;
        this.priceChanged = priceChanged;
        this.unavailable = unavailable;
    }

    public int getProductId() {
        return productId;
    }

    @NonNull
    public String getName() {
        return name;
    }

    @Nullable
    public String getImageUrl() {
        return imageUrl;
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
    public Currency getCurrency() {
        return currency;
    }

    public int getQuantity() {
        return quantity;
    }

    @NonNull
    public String getLineTotal() {
        return lineTotal;
    }

    @NonNull
    public Money getLineTotalMoney() {
        return Money.parse(lineTotal);
    }

    public boolean isInStock() {
        return inStock;
    }

    public int getAvailableQuantity() {
        return availableQuantity;
    }

    public boolean isPriceChanged() {
        return priceChanged;
    }

    public boolean isUnavailable() {
        return unavailable;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        CartItem cartItem = (CartItem) o;
        return productId == cartItem.productId &&
                quantity == cartItem.quantity &&
                inStock == cartItem.inStock &&
                availableQuantity == cartItem.availableQuantity &&
                priceChanged == cartItem.priceChanged &&
                unavailable == cartItem.unavailable &&
                Objects.equals(name, cartItem.name) &&
                Objects.equals(imageUrl, cartItem.imageUrl) &&
                Objects.equals(unitPrice, cartItem.unitPrice) &&
                currency == cartItem.currency &&
                Objects.equals(lineTotal, cartItem.lineTotal);
    }

    @Override
    public int hashCode() {
        return Objects.hash(productId, name, imageUrl, unitPrice, currency, quantity,
                lineTotal, inStock, availableQuantity, priceChanged, unavailable);
    }
}
