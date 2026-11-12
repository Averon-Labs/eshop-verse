package com.averonlabs.eshopverse.catalog;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertTrue;

import com.averonlabs.eshopverse.core.model.Currency;
import com.averonlabs.eshopverse.core.model.ProductStatus;
import com.averonlabs.eshopverse.core.model.ProductSummary;

import org.junit.Before;
import org.junit.Test;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * Unit tests for {@link ProductGridAdapter} item management and lookahead prefetch URL extraction (IMG-006).
 */
public class ProductGridAdapterTest {

    private ProductGridAdapter adapter;

    @Before
    public void setUp() {
        adapter = new ProductGridAdapter(null);
    }

    @Test
    public void testInitialState_empty() {
        assertNotNull(adapter);
        assertEquals(0, adapter.getItemCount());
        assertTrue(adapter.getItems().isEmpty());
    }

    @Test
    public void testSubmitList_updatesItemCountAndItems() {
        List<ProductSummary> sampleProducts = createSampleProducts(5);
        adapter.submitList(sampleProducts);

        assertEquals(5, adapter.getItemCount());
        assertEquals("Product 1", adapter.getItems().get(0).getName());
        assertEquals("https://example.com/item1.webp", adapter.getItems().get(0).getImageUrl());
    }

    @Test
    public void testGetItem_validAndOutOfBounds() {
        List<ProductSummary> sampleProducts = createSampleProducts(3);
        adapter.submitList(sampleProducts);

        assertNotNull(adapter.getItem(0));
        assertNotNull(adapter.getItem(2));
        assertNull(adapter.getItem(-1));
        assertNull(adapter.getItem(3));
        assertNull(adapter.getItem(100));
    }

    @Test
    public void testGetImageUrls_extractsValidUrlsWithinRange() {
        List<ProductSummary> sampleProducts = createSampleProducts(10);
        adapter.submitList(sampleProducts);

        // Fetch lookahead batch from index 2 to 6 (exclusive: indices 2, 3, 4, 5)
        List<String> urls = adapter.getImageUrls(2, 6);
        assertEquals(4, urls.size());
        assertEquals("https://example.com/item3.webp", urls.get(0));
        assertEquals("https://example.com/item4.webp", urls.get(1));
        assertEquals("https://example.com/item5.webp", urls.get(2));
        assertEquals("https://example.com/item6.webp", urls.get(3));
    }

    @Test
    public void testGetImageUrls_skipsNullAndBlankUrls() {
        List<ProductSummary> list = new ArrayList<>();
        list.add(new ProductSummary(1, "P1", "10.00", Currency.USD, 1, "Cat", "https://example.com/1.webp", true, ProductStatus.ACTIVE));
        list.add(new ProductSummary(2, "P2", "20.00", Currency.USD, 1, "Cat", null, true, ProductStatus.ACTIVE));
        list.add(new ProductSummary(3, "P3", "30.00", Currency.USD, 1, "Cat", "   ", true, ProductStatus.ACTIVE));
        list.add(new ProductSummary(4, "P4", "40.00", Currency.USD, 1, "Cat", "https://example.com/4.webp", true, ProductStatus.ACTIVE));

        adapter.submitList(list);

        List<String> urls = adapter.getImageUrls(0, 4);
        assertEquals(2, urls.size());
        assertEquals("https://example.com/1.webp", urls.get(0));
        assertEquals("https://example.com/4.webp", urls.get(1));
    }

    @Test
    public void testGetImageUrls_outOfBoundsHandledSafely() {
        List<ProductSummary> sampleProducts = createSampleProducts(4);
        adapter.submitList(sampleProducts);

        // Negative start
        assertTrue(adapter.getImageUrls(-1, 3).isEmpty());
        // Start >= size
        assertTrue(adapter.getImageUrls(4, 10).isEmpty());
        // End beyond size clamps safely
        List<String> urls = adapter.getImageUrls(2, 20);
        assertEquals(2, urls.size());
        assertEquals("https://example.com/item3.webp", urls.get(0));
        assertEquals("https://example.com/item4.webp", urls.get(1));
    }

    private List<ProductSummary> createSampleProducts(int count) {
        List<ProductSummary> list = new ArrayList<>();
        for (int i = 1; i <= count; i++) {
            list.add(new ProductSummary(
                    i,
                    "Product " + i,
                    "19.99",
                    Currency.USD,
                    1,
                    "General",
                    "https://example.com/item" + i + ".webp",
                    true,
                    ProductStatus.ACTIVE
            ));
        }
        return list;
    }
}
