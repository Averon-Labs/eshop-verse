package com.averonlabs.eshopverse.core.model;

import com.google.gson.annotations.SerializedName;

/**
 * Request payload for adding an item to the customer cart (POST /cart/items).
 */
public final class AddCartItemRequest {

    @SerializedName("productId")
    private final int productId;

    @SerializedName("quantity")
    private final int quantity;

    public AddCartItemRequest(int productId, int quantity) {
        this.productId = productId;
        this.quantity = quantity;
    }

    public int getProductId() {
        return productId;
    }

    public int getQuantity() {
        return quantity;
    }
}
