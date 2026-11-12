package com.averonlabs.eshopverse.core.model;

import androidx.annotation.NonNull;

import com.averonlabs.eshopverse.core.money.Money;
import com.google.gson.annotations.SerializedName;

import java.util.Objects;

/**
 * OrderSummary model derived from docs/openapi.yaml OrderSummary schema.
 */
public class OrderSummary {

    @SerializedName("id")
    private final int id;

    @SerializedName("reference")
    private final String reference;

    @SerializedName("status")
    private final OrderStatus status;

    @SerializedName("paymentStatus")
    private final PaymentStatus paymentStatus;

    @SerializedName("total")
    private final String total;

    @SerializedName("currency")
    private final Currency currency;

    @SerializedName("itemCount")
    private final int itemCount;

    @SerializedName("createdAt")
    private final String createdAt;

    public OrderSummary(int id, @NonNull String reference, @NonNull OrderStatus status,
                        @NonNull PaymentStatus paymentStatus, @NonNull String total,
                        @NonNull Currency currency, int itemCount, @NonNull String createdAt) {
        this.id = id;
        this.reference = Objects.requireNonNull(reference, "reference cannot be null");
        this.status = Objects.requireNonNull(status, "status cannot be null");
        this.paymentStatus = Objects.requireNonNull(paymentStatus, "paymentStatus cannot be null");
        this.total = Objects.requireNonNull(total, "total cannot be null");
        this.currency = Objects.requireNonNull(currency, "currency cannot be null");
        this.itemCount = itemCount;
        this.createdAt = Objects.requireNonNull(createdAt, "createdAt cannot be null");
    }

    public int getId() {
        return id;
    }

    @NonNull
    public String getReference() {
        return reference;
    }

    @NonNull
    public OrderStatus getStatus() {
        return status;
    }

    @NonNull
    public PaymentStatus getPaymentStatus() {
        return paymentStatus;
    }

    @NonNull
    public String getTotal() {
        return total;
    }

    @NonNull
    public Money getTotalMoney() {
        return Money.parse(total);
    }

    @NonNull
    public Currency getCurrency() {
        return currency;
    }

    public int getItemCount() {
        return itemCount;
    }

    @NonNull
    public String getCreatedAt() {
        return createdAt;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        OrderSummary that = (OrderSummary) o;
        return id == that.id &&
                itemCount == that.itemCount &&
                Objects.equals(reference, that.reference) &&
                status == that.status &&
                paymentStatus == that.paymentStatus &&
                Objects.equals(total, that.total) &&
                currency == that.currency &&
                Objects.equals(createdAt, that.createdAt);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id, reference, status, paymentStatus, total, currency, itemCount, createdAt);
    }
}
