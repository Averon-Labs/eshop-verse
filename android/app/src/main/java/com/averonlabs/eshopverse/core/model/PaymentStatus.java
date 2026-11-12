package com.averonlabs.eshopverse.core.model;

import com.google.gson.annotations.SerializedName;

public enum PaymentStatus {
    @SerializedName("pending")
    PENDING,
    @SerializedName("completed")
    COMPLETED,
    @SerializedName("failed")
    FAILED
}
