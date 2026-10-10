package com.averonlabs.eshopverse.core.model;

import androidx.annotation.NonNull;

import com.google.gson.annotations.SerializedName;

import java.util.Objects;

/**
 * Request payload for calculating a checkout quote (POST /checkout/quote).
 */
public final class CheckoutQuoteRequest {

    @SerializedName("shippingAddress")
    private final ShippingAddress shippingAddress;

    public CheckoutQuoteRequest(@NonNull ShippingAddress shippingAddress) {
        this.shippingAddress = Objects.requireNonNull(shippingAddress, "shippingAddress cannot be null");
    }

    @NonNull
    public ShippingAddress getShippingAddress() {
        return shippingAddress;
    }
}
