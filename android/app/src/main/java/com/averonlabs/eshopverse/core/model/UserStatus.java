package com.averonlabs.eshopverse.core.model;

import com.google.gson.annotations.SerializedName;

public enum UserStatus {
    @SerializedName("active")
    ACTIVE,
    @SerializedName("suspended")
    SUSPENDED,
    @SerializedName("deleted")
    DELETED
}
