package com.averonlabs.eshopverse.core.model;

import androidx.annotation.NonNull;

import com.averonlabs.eshopverse.core.money.Money;
import com.google.gson.annotations.SerializedName;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Objects;

/**
 * Cart model derived from docs/openapi.yaml Cart schema.
 */
public final class Cart {

    @SerializedName("items")
    private final List<CartItem> items;

    @SerializedName("itemCount")
    private final int itemCount;

    @SerializedName("subtotal")
    private final String subtotal;

    @SerializedName("shipping")
    private final String shipping;

    @SerializedName("total")
    private final String total;

    @SerializedName("currency")
    private final Currency currency;

    @SerializedName("hasIssues")
    private final boolean hasIssues;

    public Cart(@NonNull List<CartItem> items, int itemCount, @NonNull String subtotal,
                @NonNull String shipping, @NonNull String total, @NonNull Currency currency,
                boolean hasIssues) {
        this.items = Collections.unmodifiableList(new ArrayList<>(Objects.requireNonNull(items, "items cannot be null")));
        this.itemCount = itemCount;
        this.subtotal = Objects.requireNonNull(subtotal, "subtotal cannot be null");
        this.shipping = Objects.requireNonNull(shipping, "shipping cannot be null");
        this.total = Objects.requireNonNull(total, "total cannot be null");
        this.currency = Objects.requireNonNull(currency, "currency cannot be null");
        this.hasIssues = hasIssues;
    }

    @NonNull
    public List<CartItem> getItems() {
        return items;
    }

    public int getItemCount() {
        return itemCount;
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

    public boolean hasIssues() {
        return hasIssues;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Cart cart = (Cart) o;
        return itemCount == cart.itemCount &&
                hasIssues == cart.hasIssues &&
                items.equals(cart.items) &&
                Objects.equals(subtotal, cart.subtotal) &&
                Objects.equals(shipping, cart.shipping) &&
                Objects.equals(total, cart.total) &&
                currency == cart.currency;
    }

    @Override
    public int hashCode() {
        return Objects.hash(items, itemCount, subtotal, shipping, total, currency, hasIssues);
    }
}
