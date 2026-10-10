package com.averonlabs.eshopverse.core.money;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import java.text.NumberFormat;
import java.util.Currency;
import java.util.Locale;

/**
 * Formats Money instances or decimal strings as en-US USD (e.g. "$1,234.56").
 * The single place in the application that touches NumberFormat for currency.
 */
public final class MoneyFormat {

    private static final Locale EN_US = Locale.US;

    private MoneyFormat() {
    }

    /**
     * Formats a Money instance as en-US USD.
     */
    @NonNull
    public static String format(@Nullable Money money) {
        if (money == null) {
            return "$0.00";
        }
        NumberFormat nf = NumberFormat.getCurrencyInstance(EN_US);
        nf.setCurrency(Currency.getInstance("USD"));
        return nf.format(money.getAmount());
    }

    /**
     * Formats a raw decimal string as en-US USD.
     */
    @NonNull
    public static String format(@Nullable String decimal) {
        if (decimal == null || decimal.trim().isEmpty()) {
            return "$0.00";
        }
        Money money = Money.parse(decimal);
        return format(money);
    }
}
