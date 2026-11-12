package com.averonlabs.eshopverse.core.ui.view;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;

import android.content.Context;
import android.view.View;
import android.view.ViewGroup;
import android.widget.FrameLayout;
import android.view.LayoutInflater;
import android.widget.LinearLayout;

import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;

import com.google.android.material.textview.MaterialTextView;

import org.junit.Test;
import org.junit.runner.RunWith;

@RunWith(AndroidJUnit4.class)
public final class SharedViewsTest {
    private Context context() {
        return InstrumentationRegistry.getInstrumentation().getTargetContext();
    }

    @Test
    public void sharedViews_constructAndRenderWithAppTheme() {
        QuantityStepperView quantity = new QuantityStepperView(context());
        PriceTextView price = new PriceTextView(context());
        StateContainerView state = new StateContainerView(context());
        StatusBadgeView badge = new StatusBadgeView(context());

        assertNotNull(quantity.getChildAt(0));
        price.setFormattedPrice("$12.34");
        assertEquals("$12.34", price.getText().toString());
        state.setState(StateContainerView.State.EMPTY, "No items", null, null);
        badge.setText("Delivered");
        badge.setStatus(StatusBadgeView.Status.SUCCESS);
        assertEquals("Delivered", badge.getText().toString());
    }

    @Test
    public void sharedViews_inflateFromXmlWithoutResourceErrors() {
        LinearLayout root = (LinearLayout) LayoutInflater.from(context())
                .inflate(com.averonlabs.eshopverse.test.R.layout.shared_views_test, null, false);

        assertEquals(4, root.getChildCount());
        assertTrue(root.getChildAt(0) instanceof QuantityStepperView);
        assertTrue(root.getChildAt(1) instanceof PriceTextView);
        assertTrue(root.getChildAt(2) instanceof StateContainerView);
        assertTrue(root.getChildAt(3) instanceof StatusBadgeView);
    }

    @Test
    public void quantityStepper_userActionUpdatesValueAndNotifiesOnce() {
        QuantityStepperView quantity = new QuantityStepperView(context());
        final int[] callbacks = {0};
        quantity.setOnQuantityChangedListener(value -> callbacks[0] = value);
        quantity.getChildAt(2).performClick();

        assertEquals(2, quantity.getQuantity());
        assertEquals(2, callbacks[0]);
    }

    @Test
    public void stateContainer_errorRetryInvokesCallbackAndContentCanBeShown() {
        StateContainerView state = new StateContainerView(context());
        final boolean[] retried = {false};
        state.setState(StateContainerView.State.ERROR, "Try again", "Retry", () -> retried[0] = true);
        ViewGroup messagePanel = (ViewGroup) state.getChildAt(1);
        messagePanel.getChildAt(2).performClick();
        MaterialTextView content = new MaterialTextView(context());
        state.setContentView(content);
        state.setState(StateContainerView.State.CONTENT, null, null, null);

        assertTrue(retried[0]);
        assertEquals(View.VISIBLE, state.getChildAt(0).getVisibility());
        assertTrue(state.getChildAt(0) instanceof FrameLayout);
    }
}
