package com.averonlabs.eshopverse.core.model;

import androidx.annotation.NonNull;

import com.google.gson.annotations.SerializedName;

import java.util.Objects;

/**
 * Request payload for submitting simulated payment (POST /orders/{orderId}/payment).
 */
public final class SimulatedPaymentRequest {

    @SerializedName("method")
    private final PaymentMethod method;

    @SerializedName("simulateOutcome")
    private final String simulateOutcome;

    public SimulatedPaymentRequest(@NonNull PaymentMethod method, @NonNull String simulateOutcome) {
        this.method = Objects.requireNonNull(method, "method cannot be null");
        this.simulateOutcome = Objects.requireNonNull(simulateOutcome, "simulateOutcome cannot be null");
    }

    @NonNull
    public PaymentMethod getMethod() {
        return method;
    }

    @NonNull
    public String getSimulateOutcome() {
        return simulateOutcome;
    }
}
