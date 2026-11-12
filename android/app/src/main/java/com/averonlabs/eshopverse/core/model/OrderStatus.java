package com.averonlabs.eshopverse.core.model;

import com.google.gson.annotations.SerializedName;

public enum OrderStatus {
    @SerializedName("pending_payment")
    PENDING_PAYMENT,
    @SerializedName("confirmed")
    CONFIRMED,
    @SerializedName("processing")
    PROCESSING,
    @SerializedName("shipped")
    SHIPPED,
    @SerializedName("delivered")
    DELIVERED,
    @SerializedName("cancelled")
    CANCELLED
}
