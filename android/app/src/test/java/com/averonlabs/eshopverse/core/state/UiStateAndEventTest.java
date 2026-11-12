package com.averonlabs.eshopverse.core.state;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertTrue;

import org.junit.Test;

import java.util.Arrays;
import java.util.Collections;

public class UiStateAndEventTest {

    @Test
    public void testUiStateTransitions() {
        UiState<String> loading = UiState.loading();
        assertTrue(loading.isLoading());
        assertFalse(loading.isContent());
        assertFalse(loading.isEmpty());
        assertFalse(loading.isError());

        UiState<String> content = UiState.content("Loaded Data");
        assertFalse(content.isLoading());
        assertTrue(content.isContent());
        assertEquals("Loaded Data", content.getData());

        UiState<String> empty = UiState.empty();
        assertTrue(empty.isEmpty());
        assertFalse(empty.isContent());

        UiState<String> error = UiState.error(1234, true);
        assertTrue(error.isError());
        assertEquals(1234, error.getMessageRes());
        assertTrue(error.isRetryable());
    }

    @Test
    public void testEventOneShotDelivery() {
        Event<String> event = new Event<>("NavigateToCheckout");

        assertFalse(event.hasBeenHandled());
        assertEquals("NavigateToCheckout", event.peekContent());
        assertFalse(event.hasBeenHandled());

        assertEquals("NavigateToCheckout", event.getContentIfNotHandled());
        assertTrue(event.hasBeenHandled());

        // Second attempt must return null
        assertNull(event.getContentIfNotHandled());
        // peekContent still works
        assertEquals("NavigateToCheckout", event.peekContent());
    }

    @Test
    public void testPagedMetadata() {
        Paged<Integer> page1 = new Paged<>(Arrays.asList(1, 2, 3), 1, 3, 10, 4);
        assertEquals(3, page1.getItems().size());
        assertEquals(1, page1.getCurrentPage());
        assertEquals(3, page1.getPerPage());
        assertEquals(10, page1.getTotalItems());
        assertEquals(4, page1.getTotalPages());
        assertTrue(page1.hasMore());

        Paged<Integer> pageLast = new Paged<>(Collections.singletonList(10), 4, 3, 10, 4);
        assertFalse(pageLast.hasMore());
    }
}
