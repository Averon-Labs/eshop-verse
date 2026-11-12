package com.averonlabs.eshopverse.core.model;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.google.gson.annotations.SerializedName;

import java.util.Objects;

/**
 * PaymentResult model derived from docs/openapi.yaml PaymentResult schema.
 */
public final class PaymentResult {

    @SerializedName("orderId")
    private final int orderId;

    @SerializedName("orderReference")
    private final String orderReference;

    @SerializedName("orderStatus")
    private final OrderStatus orderStatus;

    @SerializedName("paymentStatus")
    private final PaymentStatus paymentStatus;

    @SerializedName("simulated")
    private final boolean simulated;

    @SerializedName("payment")
    private final OrderPayment payment;

    public PaymentResult(int orderId, @NonNull String orderReference, @NonNull OrderStatus orderStatus,
                         @NonNull PaymentStatus paymentStatus, boolean simulated,
                         @Nullable OrderPayment payment) {
        this.orderId = orderId;
        this.orderReference = Objects.requireNonNull(orderReference, "orderReference cannot be null");
        this.orderStatus = Objects.requireNonNull(orderStatus, "orderStatus cannot be null");
        this.paymentStatus = Objects.requireNonNull(paymentStatus, "paymentStatus cannot be null");
        this.simulated = simulated;
        this.payment = payment;
    }

    public int getOrderId() {
        return orderId;
    }

    @NonNull
    public String getOrderReference() {
        return orderReference;
    }

    @NonNull
    public OrderStatus getOrderStatus() {
        return orderStatus;
    }

    @NonNull
    public PaymentStatus getPaymentStatus() {
        return paymentStatus;
    }

    public boolean isSimulated() {
        return simulated;
    }

    @Nullable
    public OrderPayment getPayment() {
        return payment;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        PaymentResult that = (PaymentResult) o;
        return orderId == that.orderId &&
                simulated == that.simulated &&
                Objects.equals(orderReference, that.orderReference) &&
                orderStatus == that.orderStatus &&
                paymentStatus == that.paymentStatus &&
                Objects.equals(payment, that.payment);
    }

    @Override
    public int hashCode() {
        return Objects.hash(orderId, orderReference, orderStatus, paymentStatus, simulated, payment);
    }
}
