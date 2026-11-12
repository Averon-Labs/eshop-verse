package com.averonlabs.eshopverse.core.ui.view;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;

import org.junit.Test;

public final class SharedViewEnumsTest {

    @Test
    public void statusBadgeView_statusValues_containsAllDocumentedStates() {
        StatusBadgeView.Status[] statuses = StatusBadgeView.Status.values();
        assertEquals(4, statuses.length);
        assertNotNull(StatusBadgeView.Status.valueOf("SUCCESS"));
        assertNotNull(StatusBadgeView.Status.valueOf("WARNING"));
        assertNotNull(StatusBadgeView.Status.valueOf("ERROR"));
        assertNotNull(StatusBadgeView.Status.valueOf("NEUTRAL"));
    }

    @Test
    public void stateContainerView_stateValues_containsAllDocumentedStates() {
        StateContainerView.State[] states = StateContainerView.State.values();
        assertEquals(4, states.length);
        assertNotNull(StateContainerView.State.valueOf("CONTENT"));
        assertNotNull(StateContainerView.State.valueOf("LOADING"));
        assertNotNull(StateContainerView.State.valueOf("EMPTY"));
        assertNotNull(StateContainerView.State.valueOf("ERROR"));
    }
}
