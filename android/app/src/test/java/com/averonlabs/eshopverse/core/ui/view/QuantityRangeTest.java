package com.averonlabs.eshopverse.core.ui.view;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertThrows;

import org.junit.Test;

public final class QuantityRangeTest {
    @Test
    public void setQuantity_belowMinimum_clampsToMinimum() {
        QuantityRange range = new QuantityRange();
        assertEquals(1, range.setQuantity(-2));
    }

    @Test
    public void increment_atMaximum_keepsMaximum() {
        QuantityRange range = new QuantityRange();
        range.setMax(2);
        range.setQuantity(2);
        assertEquals(2, range.increment());
    }

    @Test
    public void decrement_atMinimum_keepsMinimum() {
        QuantityRange range = new QuantityRange();
        assertEquals(1, range.decrement());
    }

    @Test
    public void setMin_aboveMaximum_throws() {
        QuantityRange range = new QuantityRange();
        range.setMax(2);
        assertThrows(IllegalArgumentException.class, () -> range.setMin(3));
    }

    @Test
    public void setMax_belowMinimum_throws() {
        QuantityRange range = new QuantityRange();
        assertThrows(IllegalArgumentException.class, () -> range.setMax(0));
    }
}
