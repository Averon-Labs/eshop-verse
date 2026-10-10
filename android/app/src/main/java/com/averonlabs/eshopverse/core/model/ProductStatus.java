package com.averonlabs.eshopverse.core.model;

import com.google.gson.annotations.SerializedName;

public enum ProductStatus {
    @SerializedName("active")
    ACTIVE,
    @SerializedName("inactive")
    INACTIVE,
    @SerializedName("archived")
    ARCHIVED
}
