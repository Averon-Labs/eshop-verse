package com.averonlabs.eshopverse.core.money;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotEquals;
import static org.junit.Assert.assertTrue;
import static org.junit.Assert.fail;

import org.junit.Test;

import java.lang.reflect.Constructor;
import java.lang.reflect.Method;
import java.math.BigDecimal;

public class MoneyTest {

    @Test
    public void testParseAndEquality() {
        Money m1 = Money.parse("19.99");
        Money m2 = Money.parse("19.99");
        Money m3 = Money.parse("20.00");

        assertEquals(m1, m2);
        assertNotEquals(m1, m3);
        assertEquals(0, m1.compareTo(m2));
        assertTrue(m1.compareTo(m3) < 0);
        assertTrue(m3.compareTo(m1) > 0);
        assertEquals("19.99", m1.toPlainString());
    }

    @Test
    public void testZero() {
        Money zero = Money.ZERO;
        assertTrue(zero.isZero());
        assertEquals("0.00", zero.toPlainString());
        assertEquals(zero, Money.parse("0.00"));
        assertEquals(zero, Money.parse("0"));
    }

    @Test
    public void testArithmetic() {
        Money a = Money.parse("10.50");
        Money b = Money.parse("5.25");

        Money sum = a.plus(b);
        assertEquals(Money.parse("15.75"), sum);

        Money diff = a.minus(b);
        assertEquals(Money.parse("5.25"), diff);

        Money product = b.times(3);
        assertEquals(Money.parse("15.75"), product);

        Money productZero = a.times(0);
        assertEquals(Money.ZERO, productZero);
    }

    @Test(expected = ArithmeticException.class)
    public void testMinusNegativeThrows() {
        Money a = Money.parse("5.00");
        Money b = Money.parse("10.00");
        a.minus(b);
    }

    @Test
    public void testMalformedInputsRejected() {
        String[] malformed = {null, "", "  ", "abc", "-5.00", "12.345", "12.", ".50", "12,34"};
        for (String input : malformed) {
            try {
                Money.parse(input);
                fail("Expected IllegalArgumentException for input: '" + input + "'");
            } catch (IllegalArgumentException expected) {
                // expected
            }
        }
    }

    @Test
    public void testFromCents() {
        assertEquals(Money.parse("0.00"), Money.fromCents(0));
        assertEquals(Money.parse("0.99"), Money.fromCents(99));
        assertEquals(Money.parse("1.00"), Money.fromCents(100));
        assertEquals(Money.parse("19.99"), Money.fromCents(1999));
        assertEquals(Money.parse("1234.56"), Money.fromCents(123456));
    }

    @Test
    public void testMoneyFormatEnUs() {
        assertEquals("$0.00", MoneyFormat.format((Money) null));
        assertEquals("$0.00", MoneyFormat.format(Money.ZERO));
        assertEquals("$19.99", MoneyFormat.format(Money.parse("19.99")));
        assertEquals("$1,234.56", MoneyFormat.format(Money.parse("1234.56")));
        assertEquals("$1,000,000.00", MoneyFormat.format(Money.parse("1000000.00")));

        // raw decimal string overload
        assertEquals("$0.00", MoneyFormat.format((String) null));
        assertEquals("$19.99", MoneyFormat.format("19.99"));
        assertEquals("$1,234.56", MoneyFormat.format("1234.56"));
    }

    @Test
    public void testNoFloatingPointInMoneyContract() {
        // Assert reflection proof that Money exposes no double or float methods or constructors
        for (Constructor<?> c : Money.class.getDeclaredConstructors()) {
            for (Class<?> param : c.getParameterTypes()) {
                assertNotEquals("Money must not accept float", float.class, param);
                assertNotEquals("Money must not accept Float", Float.class, param);
                assertNotEquals("Money must not accept double", double.class, param);
                assertNotEquals("Money must not accept Double", Double.class, param);
            }
        }

        for (Method m : Money.class.getDeclaredMethods()) {
            assertNotEquals("Money must not return float: " + m.getName(), float.class, m.getReturnType());
            assertNotEquals("Money must not return Float: " + m.getName(), Float.class, m.getReturnType());
            assertNotEquals("Money must not return double: " + m.getName(), double.class, m.getReturnType());
            assertNotEquals("Money must not return Double: " + m.getName(), Double.class, m.getReturnType());

            for (Class<?> param : m.getParameterTypes()) {
                assertNotEquals("Method " + m.getName() + " must not accept float", float.class, param);
                assertNotEquals("Method " + m.getName() + " must not accept Float", Float.class, param);
                assertNotEquals("Method " + m.getName() + " must not accept double", double.class, param);
                assertNotEquals("Method " + m.getName() + " must not accept Double", Double.class, param);
            }
        }
    }
}
