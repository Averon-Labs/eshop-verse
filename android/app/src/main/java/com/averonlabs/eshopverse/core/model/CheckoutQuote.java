package com.averonlabs.eshopverse.core.model;

import androidx.annotation.NonNull;

import com.averonlabs.eshopverse.core.money.Money;
import com.google.gson.annotations.SerializedName;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Objects;

/**
 * CheckoutQuote model derived from docs/openapi.yaml CheckoutQuote schema.
 */
public final class CheckoutQuote {

    @SerializedName("items")
    private final List<CartItem> items;

    @SerializedName("subtotal")
    private final String subtotal;

    @SerializedName("shipping")
    private final String shipping;

    @SerializedName("total")
    private final String total;

    @SerializedName("currency")
    private final Currency currency;

    @SerializedName("shippingAddress")
    private final ShippingAddress shippingAddress;

    @SerializedName("shippingAddressId")
    private final String shippingAddressId;

    public CheckoutQuote(@NonNull List<CartItem> items, @NonNull String subtotal,
                         @NonNull String shipping, @NonNull String total,
                         @NonNull Currency currency, @NonNull ShippingAddress shippingAddress,
                         @NonNull String shippingAddressId) {
        this.items = Collections.unmodifiableList(new ArrayList<>(Objects.requireNonNull(items, "items cannot be null")));
        this.subtotal = Objects.requireNonNull(subtotal, "subtotal cannot be null");
        this.shipping = Objects.requireNonNull(shipping, "shipping cannot be null");
        this.total = Objects.requireNonNull(total, "total cannot be null");
        this.currency = Objects.requireNonNull(currency, "currency cannot be null");
        this.shippingAddress = Objects.requireNonNull(shippingAddress, "shippingAddress cannot be null");
        this.shippingAddressId = Objects.requireNonNull(shippingAddressId, "shippingAddressId cannot be null");
    }

    @NonNull
    public List<CartItem> getItems() {
        return items;
    }

    @NonNull
    public String getSubtotal() {
        return subtotal;
    }

    @NonNull
    public Money getSubtotalMoney() {
        return Money.parse(subtotal);
    }

    @NonNull
    public String getShipping() {
        return shipping;
    }

    @NonNull
    public Money getShippingMoney() {
        return Money.parse(shipping);
    }

    @NonNull
    public String getTotal() {
        return total;
    }

    @NonNull
    public Money getTotalMoney() {
        return Money.parse(total);
    }

    @NonNull
    public Currency getCurrency() {
        return currency;
    }

    @NonNull
    public ShippingAddress getShippingAddress() {
        return shippingAddress;
    }

    @NonNull
    public String getShippingAddressId() {
        return shippingAddressId;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        CheckoutQuote that = (CheckoutQuote) o;
        return items.equals(that.items) &&
                Objects.equals(subtotal, that.subtotal) &&
                Objects.equals(shipping, that.shipping) &&
                Objects.equals(total, that.total) &&
                currency == that.currency &&
                Objects.equals(shippingAddress, that.shippingAddress) &&
                Objects.equals(shippingAddressId, that.shippingAddressId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(items, subtotal, shipping, total, currency, shippingAddress, shippingAddressId);
    }
}
