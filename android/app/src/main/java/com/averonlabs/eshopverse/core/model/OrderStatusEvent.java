package com.averonlabs.eshopverse.core.model;

import androidx.annotation.NonNull;

import com.google.gson.annotations.SerializedName;

import java.util.Objects;

/**
 * OrderStatusEvent model derived from docs/openapi.yaml OrderStatusEvent schema.
 */
public final class OrderStatusEvent {

    @SerializedName("status")
    private final OrderStatus status;

    @SerializedName("at")
    private final String at;

    public OrderStatusEvent(@NonNull OrderStatus status, @NonNull String at) {
        this.status = Objects.requireNonNull(status, "status cannot be null");
        this.at = Objects.requireNonNull(at, "at cannot be null");
    }

    @NonNull
    public OrderStatus getStatus() {
        return status;
    }

    @NonNull
    public String getAt() {
        return at;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        OrderStatusEvent that = (OrderStatusEvent) o;
        return status == that.status && Objects.equals(at, that.at);
    }

    @Override
    public int hashCode() {
        return Objects.hash(status, at);
    }
}
