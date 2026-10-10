package com.averonlabs.eshopverse.shell;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;

import android.content.Context;
import android.content.Intent;
import android.view.View;

import androidx.test.core.app.ActivityScenario;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;

import com.averonlabs.eshopverse.MainActivity;
import com.averonlabs.eshopverse.R;
import com.google.android.material.badge.BadgeDrawable;
import com.google.android.material.bottomnavigation.BottomNavigationView;

import org.junit.Test;
import org.junit.runner.RunWith;

@RunWith(AndroidJUnit4.class)
public final class ShellInstrumentationTest {

    private Context context() {
        return InstrumentationRegistry.getInstrumentation().getTargetContext();
    }

    @Test
    public void shell_bootsAndExposesBottomNavigationAndCartBadge() {
        Intent intent = new Intent(context(), MainActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);

        try (ActivityScenario<MainActivity> scenario = ActivityScenario.launch(intent)) {
            scenario.onActivity(activity -> {
                BottomNavigationView bottomNav = activity.findViewById(R.id.bottom_nav);
                assertNotNull("Bottom navigation must exist", bottomNav);
                assertEquals("Bottom navigation must have 4 items", 4, bottomNav.getMenu().size());
                assertNotNull(bottomNav.getMenu().findItem(R.id.homeFragment));
                assertNotNull(bottomNav.getMenu().findItem(R.id.exploreFragment));
                assertNotNull(bottomNav.getMenu().findItem(R.id.cartFragment));
                assertNotNull(bottomNav.getMenu().findItem(R.id.accountFragment));

                // Verify cart badge API
                activity.setCartBadgeCount(3);
                BadgeDrawable badge = bottomNav.getBadge(R.id.cartFragment);
                assertNotNull("Badge should exist when count > 0", badge);
                assertTrue("Badge should be visible when count > 0", badge.isVisible());
                assertEquals(3, badge.getNumber());

                // Reset badge
                activity.setCartBadgeCount(0);
                BadgeDrawable clearedBadge = bottomNav.getBadge(R.id.cartFragment);
                assertTrue(clearedBadge == null || !clearedBadge.isVisible());
            });
        }
    }
}
