package com.averonlabs.eshopverse.core.model;

import com.google.gson.annotations.SerializedName;

public enum UserRole {
    @SerializedName("customer")
    CUSTOMER,
    @SerializedName("admin")
    ADMIN
}
