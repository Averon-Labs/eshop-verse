package com.averonlabs.eshopverse.core.net;

import androidx.annotation.Nullable;

import com.google.gson.annotations.SerializedName;

/**
 * Generic response envelope for single-item payloads: { "data": T }.
 *
 * @param <T> Payload type.
 */
public final class ApiResponse<T> {

    @SerializedName("data")
    private final T data;

    public ApiResponse(@Nullable T data) {
        this.data = data;
    }

    @Nullable
    public T getData() {
        return data;
    }
}
