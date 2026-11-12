package com.averonlabs.eshopverse.core.model;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.google.gson.annotations.SerializedName;

import java.util.Objects;

/**
 * Request payload for creating an order (POST /orders).
 */
public final class CreateOrderRequest {

    @SerializedName("shippingAddress")
    private final ShippingAddress shippingAddress;

    @SerializedName("notes")
    private final String notes;

    public CreateOrderRequest(@NonNull ShippingAddress shippingAddress, @Nullable String notes) {
        this.shippingAddress = Objects.requireNonNull(shippingAddress, "shippingAddress cannot be null");
        this.notes = notes;
    }

    @NonNull
    public ShippingAddress getShippingAddress() {
        return shippingAddress;
    }

    @Nullable
    public String getNotes() {
        return notes;
    }
}
