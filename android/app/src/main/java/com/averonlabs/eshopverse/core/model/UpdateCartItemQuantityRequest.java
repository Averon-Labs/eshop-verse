package com.averonlabs.eshopverse.core.model;

import com.google.gson.annotations.SerializedName;

/**
 * Request payload for updating cart item quantity (PATCH /cart/items/{productId}).
 */
public final class UpdateCartItemQuantityRequest {

    @SerializedName("quantity")
    private final int quantity;

    public UpdateCartItemQuantityRequest(int quantity) {
        this.quantity = quantity;
    }

    public int getQuantity() {
        return quantity;
    }
}
