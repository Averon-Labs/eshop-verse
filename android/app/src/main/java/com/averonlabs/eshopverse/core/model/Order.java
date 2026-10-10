package com.averonlabs.eshopverse.core.model;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.averonlabs.eshopverse.core.money.Money;
import com.google.gson.annotations.SerializedName;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Objects;

/**
 * Order model derived from docs/openapi.yaml Order schema.
 */
public final class Order {

    @SerializedName("id")
    private final int id;

    @SerializedName("reference")
    private final String reference;

    @SerializedName("status")
    private final OrderStatus status;

    @SerializedName("paymentStatus")
    private final PaymentStatus paymentStatus;

    @SerializedName("items")
    private final List<OrderItem> items;

    @SerializedName("subtotal")
    private final String subtotal;

    @SerializedName("shipping")
    private final String shipping;

    @SerializedName("total")
    private final String total;

    @SerializedName("currency")
    private final Currency currency;

    @SerializedName("shippingAddress")
    private final ShippingAddress shippingAddress;

    @SerializedName("notes")
    private final String notes;

    @SerializedName("payment")
    private final OrderPayment payment;

    @SerializedName("timeline")
    private final List<OrderStatusEvent> timeline;

    @SerializedName("createdAt")
    private final String createdAt;

    @SerializedName("updatedAt")
    private final String updatedAt;

    public Order(int id, @NonNull String reference, @NonNull OrderStatus status,
                 @NonNull PaymentStatus paymentStatus, @NonNull List<OrderItem> items,
                 @NonNull String subtotal, @NonNull String shipping, @NonNull String total,
                 @NonNull Currency currency, @NonNull ShippingAddress shippingAddress,
                 @Nullable String notes, @Nullable OrderPayment payment,
                 @NonNull List<OrderStatusEvent> timeline, @NonNull String createdAt,
                 @NonNull String updatedAt) {
        this.id = id;
        this.reference = Objects.requireNonNull(reference, "reference cannot be null");
        this.status = Objects.requireNonNull(status, "status cannot be null");
        this.paymentStatus = Objects.requireNonNull(paymentStatus, "paymentStatus cannot be null");
        this.items = Collections.unmodifiableList(new ArrayList<>(Objects.requireNonNull(items, "items cannot be null")));
        this.subtotal = Objects.requireNonNull(subtotal, "subtotal cannot be null");
        this.shipping = Objects.requireNonNull(shipping, "shipping cannot be null");
        this.total = Objects.requireNonNull(total, "total cannot be null");
        this.currency = Objects.requireNonNull(currency, "currency cannot be null");
        this.shippingAddress = Objects.requireNonNull(shippingAddress, "shippingAddress cannot be null");
        this.notes = notes;
        this.payment = payment;
        this.timeline = Collections.unmodifiableList(new ArrayList<>(Objects.requireNonNull(timeline, "timeline cannot be null")));
        this.createdAt = Objects.requireNonNull(createdAt, "createdAt cannot be null");
        this.updatedAt = Objects.requireNonNull(updatedAt, "updatedAt cannot be null");
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
    public List<OrderItem> getItems() {
        return items;
    }

    @NonNull
    public String getSubtotal() {
        return subtotal;
    }

    @NonNull
    public Money getSubtotalMoney() {
        return Money.parse(subtotal);
    }

    @NonNull
    public String getShipping() {
        return shipping;
    }

    @NonNull
    public Money getShippingMoney() {
        return Money.parse(shipping);
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

    @NonNull
    public ShippingAddress getShippingAddress() {
        return shippingAddress;
    }

    @Nullable
    public String getNotes() {
        return notes;
    }

    @Nullable
    public OrderPayment getPayment() {
        return payment;
    }

    @NonNull
    public List<OrderStatusEvent> getTimeline() {
        return timeline;
    }

    @NonNull
    public String getCreatedAt() {
        return createdAt;
    }

    @NonNull
    public String getUpdatedAt() {
        return updatedAt;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Order order = (Order) o;
        return id == order.id &&
                Objects.equals(reference, order.reference) &&
                status == order.status &&
                paymentStatus == order.paymentStatus &&
                items.equals(order.items) &&
                Objects.equals(subtotal, order.subtotal) &&
                Objects.equals(shipping, order.shipping) &&
                Objects.equals(total, order.total) &&
                currency == order.currency &&
                Objects.equals(shippingAddress, order.shippingAddress) &&
                Objects.equals(notes, order.notes) &&
                Objects.equals(payment, order.payment) &&
                timeline.equals(order.timeline) &&
                Objects.equals(createdAt, order.createdAt) &&
                Objects.equals(updatedAt, order.updatedAt);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id, reference, status, paymentStatus, items, subtotal,
                shipping, total, currency, shippingAddress, notes, payment, timeline,
                createdAt, updatedAt);
    }
}
