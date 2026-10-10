package com.averonlabs.eshopverse.core.model;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.averonlabs.eshopverse.core.money.Money;
import com.google.gson.annotations.SerializedName;

import java.util.Objects;

/**
 * OrderPayment model derived from docs/openapi.yaml OrderPayment schema.
 */
public final class OrderPayment {

    @SerializedName("method")
    private final PaymentMethod method;

    @SerializedName("status")
    private final PaymentStatus status;

    @SerializedName("amount")
    private final String amount;

    @SerializedName("currency")
    private final Currency currency;

    @SerializedName("transactionId")
    private final String transactionId;

    @SerializedName("createdAt")
    private final String createdAt;

    public OrderPayment(@NonNull PaymentMethod method, @NonNull PaymentStatus status,
                        @NonNull String amount, @NonNull Currency currency,
                        @Nullable String transactionId, @NonNull String createdAt) {
        this.method = Objects.requireNonNull(method, "method cannot be null");
        this.status = Objects.requireNonNull(status, "status cannot be null");
        this.amount = Objects.requireNonNull(amount, "amount cannot be null");
        this.currency = Objects.requireNonNull(currency, "currency cannot be null");
        this.transactionId = transactionId;
        this.createdAt = Objects.requireNonNull(createdAt, "createdAt cannot be null");
    }

    @NonNull
    public PaymentMethod getMethod() {
        return method;
    }

    @NonNull
    public PaymentStatus getStatus() {
        return status;
    }

    @NonNull
    public String getAmount() {
        return amount;
    }

    @NonNull
    public Money getAmountMoney() {
        return Money.parse(amount);
    }

    @NonNull
    public Currency getCurrency() {
        return currency;
    }

    @Nullable
    public String getTransactionId() {
        return transactionId;
    }

    @NonNull
    public String getCreatedAt() {
        return createdAt;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        OrderPayment that = (OrderPayment) o;
        return method == that.method &&
                status == that.status &&
                Objects.equals(amount, that.amount) &&
                currency == that.currency &&
                Objects.equals(transactionId, that.transactionId) &&
                Objects.equals(createdAt, that.createdAt);
    }

    @Override
    public int hashCode() {
        return Objects.hash(method, status, amount, currency, transactionId, createdAt);
    }
}
