package com.averonlabs.eshopverse.core.model;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.google.gson.annotations.SerializedName;

import java.util.Objects;

/**
 * ShippingAddress model derived from docs/openapi.yaml ShippingAddress schema.
 */
public final class ShippingAddress {

    @SerializedName("recipientName")
    private final String recipientName;

    @SerializedName("line1")
    private final String line1;

    @SerializedName("line2")
    private final String line2;

    @SerializedName("city")
    private final String city;

    @SerializedName("region")
    private final String region;

    @SerializedName("postalCode")
    private final String postalCode;

    @SerializedName("country")
    private final String country;

    public ShippingAddress(@NonNull String recipientName, @NonNull String line1, @Nullable String line2,
                           @NonNull String city, @NonNull String region, @NonNull String postalCode,
                           @NonNull String country) {
        this.recipientName = Objects.requireNonNull(recipientName, "recipientName cannot be null");
        this.line1 = Objects.requireNonNull(line1, "line1 cannot be null");
        this.line2 = line2;
        this.city = Objects.requireNonNull(city, "city cannot be null");
        this.region = Objects.requireNonNull(region, "region cannot be null");
        this.postalCode = Objects.requireNonNull(postalCode, "postalCode cannot be null");
        this.country = Objects.requireNonNull(country, "country cannot be null");
    }

    @NonNull
    public String getRecipientName() {
        return recipientName;
    }

    @NonNull
    public String getLine1() {
        return line1;
    }

    @Nullable
    public String getLine2() {
        return line2;
    }

    @NonNull
    public String getCity() {
        return city;
    }

    @NonNull
    public String getRegion() {
        return region;
    }

    @NonNull
    public String getPostalCode() {
        return postalCode;
    }

    @NonNull
    public String getCountry() {
        return country;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        ShippingAddress that = (ShippingAddress) o;
        return Objects.equals(recipientName, that.recipientName) &&
                Objects.equals(line1, that.line1) &&
                Objects.equals(line2, that.line2) &&
                Objects.equals(city, that.city) &&
                Objects.equals(region, that.region) &&
                Objects.equals(postalCode, that.postalCode) &&
                Objects.equals(country, that.country);
    }

    @Override
    public int hashCode() {
        return Objects.hash(recipientName, line1, line2, city, region, postalCode, country);
    }
}
