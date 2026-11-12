package com.averonlabs.eshopverse.core.money;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Objects;
import java.util.regex.Pattern;

/**
 * Fixed-precision decimal money representation for USD.
 * Always maintained at scale 2 with HALF_UP rounding.
 * Rejects floating-point types entirely to prevent precision defects.
 */
public final class Money implements Comparable<Money> {

    public static final Money ZERO = new Money(BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP));
    private static final Pattern VALID_DECIMAL_PATTERN = Pattern.compile("^\\d+(\\.\\d{1,2})?$");

    @NonNull
    private final BigDecimal amount;

    private Money(@NonNull BigDecimal amount) {
        this.amount = amount.setScale(2, RoundingMode.HALF_UP);
    }

    /**
     * Parses a decimal string (e.g. "19.99" or "5") into a Money instance.
     * Rejects null, empty, negative, or malformed strings.
     */
    @NonNull
    public static Money parse(@Nullable String value) {
        if (value == null || value.trim().isEmpty()) {
            throw new IllegalArgumentException("Money string cannot be null or empty");
        }
        String trimmed = value.trim();
        if (!VALID_DECIMAL_PATTERN.matcher(trimmed).matches()) {
            throw new IllegalArgumentException("Invalid money format: '" + value + "'");
        }
        try {
            BigDecimal parsed = new BigDecimal(trimmed);
            return new Money(parsed);
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("Invalid decimal format: " + value, e);
        }
    }

    /**
     * Creates a Money instance from an exact integer cents value.
     */
    @NonNull
    public static Money fromCents(long cents) {
        if (cents < 0) {
            throw new IllegalArgumentException("Money amount cannot be negative: " + cents);
        }
        BigDecimal bd = BigDecimal.valueOf(cents).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        return new Money(bd);
    }

    @NonNull
    public Money plus(@NonNull Money other) {
        Objects.requireNonNull(other, "other cannot be null");
        return new Money(this.amount.add(other.amount));
    }

    @NonNull
    public Money minus(@NonNull Money other) {
        Objects.requireNonNull(other, "other cannot be null");
        BigDecimal result = this.amount.subtract(other.amount);
        if (result.compareTo(BigDecimal.ZERO) < 0) {
            throw new ArithmeticException("Money amount cannot be negative: " + result);
        }
        return new Money(result);
    }

    @NonNull
    public Money times(int factor) {
        if (factor < 0) {
            throw new IllegalArgumentException("Factor cannot be negative: " + factor);
        }
        return new Money(this.amount.multiply(BigDecimal.valueOf(factor)));
    }

    public boolean isZero() {
        return this.amount.compareTo(BigDecimal.ZERO) == 0;
    }

    @NonNull
    public BigDecimal getAmount() {
        return amount;
    }

    @NonNull
    public String toPlainString() {
        return amount.toPlainString();
    }

    @Override
    public int compareTo(@NonNull Money other) {
        return this.amount.compareTo(other.amount);
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Money money = (Money) o;
        return this.amount.compareTo(money.amount) == 0;
    }

    @Override
    public int hashCode() {
        return amount.stripTrailingZeros().hashCode();
    }

    @NonNull
    @Override
    public String toString() {
        return toPlainString();
    }
}
