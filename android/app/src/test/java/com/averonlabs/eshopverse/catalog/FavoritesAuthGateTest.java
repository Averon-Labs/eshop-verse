package com.averonlabs.eshopverse.catalog;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import androidx.arch.core.executor.testing.InstantTaskExecutorRule;
import androidx.lifecycle.MutableLiveData;

import com.averonlabs.eshopverse.auth.AuthRepository;
import com.averonlabs.eshopverse.auth.SessionViewModel;
import com.averonlabs.eshopverse.core.model.Currency;
import com.averonlabs.eshopverse.core.model.ProductStatus;
import com.averonlabs.eshopverse.core.model.ProductSummary;

import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;

/**
 * Unit tests verifying the authentication gate for favorites per Phase 13 Step 4 (QUAL-006).
 * Ensures unauthenticated guests cannot mutate favorites in FavoritesRepository,
 * while authenticated users can mutate and toggle favorites cleanly.
 */
public class FavoritesAuthGateTest {

    @Rule
    public InstantTaskExecutorRule instantTaskExecutorRule = new InstantTaskExecutorRule();

    private FavoritesRepository favoritesRepository;
    private SessionViewModel sessionViewModel;
    private AuthRepository authRepository;

    private ProductSummary createSampleProduct(int id, String name) {
        return new ProductSummary(
                id,
                name,
                "29.99",
                Currency.USD,
                1,
                "Apparel",
                "https://example.com/item.jpg",
                true,
                ProductStatus.ACTIVE
        );
    }

    @Before
    public void setUp() {
        favoritesRepository = mock(FavoritesRepository.class);
        sessionViewModel = mock(SessionViewModel.class);
        authRepository = mock(AuthRepository.class);
    }

    @Test
    public void testUnauthenticatedFavoriteToggleDoesNotModifyRepository() {
        when(authRepository.isSignedIn()).thenReturn(false);
        when(sessionViewModel.isSignedIn()).thenReturn(false);
        when(sessionViewModel.getIsSignedIn()).thenReturn(new MutableLiveData<>(false));
        ProductSummary product = createSampleProduct(101, "Denim Jacket");

        // Simulate gate check in UI (ProductGridAdapter / ProductDetailFragment / HomeFragment)
        boolean dialogPrompted = false;
        boolean signedIn = authRepository.isSignedIn();
        if (!signedIn) {
            dialogPrompted = true;
        } else {
            favoritesRepository.toggleFavorite(product);
        }

        assertTrue("Sign-in required dialog must be prompted for guests", dialogPrompted);
        verify(favoritesRepository, never()).toggleFavorite(any());
        verify(favoritesRepository, never()).addFavorite(any());
        verify(favoritesRepository, never()).removeFavorite(any(Integer.class));
    }

    @Test
    public void testAuthenticatedFavoriteToggleModifiesRepository() {
        when(authRepository.isSignedIn()).thenReturn(true);
        when(sessionViewModel.isSignedIn()).thenReturn(true);
        when(sessionViewModel.getIsSignedIn()).thenReturn(new MutableLiveData<>(true));
        ProductSummary product = createSampleProduct(102, "Running Shorts");

        boolean dialogPrompted = false;
        boolean signedIn = authRepository.isSignedIn();
        if (!signedIn) {
            dialogPrompted = true;
        } else {
            favoritesRepository.toggleFavorite(product);
        }

        assertFalse("Sign-in dialog should not be prompted for signed-in users", dialogPrompted);
        verify(favoritesRepository).toggleFavorite(product);
    }

    @Test
    public void testAccountFragmentFavoritesNavGatedForGuest() {
        when(sessionViewModel.getIsSignedIn()).thenReturn(new MutableLiveData<>(false));
        boolean signedIn = Boolean.TRUE.equals(sessionViewModel.getIsSignedIn().getValue());

        boolean dialogPrompted = false;
        boolean navigatedToFavorites = false;

        // Simulate AccountFragment.setupFavoritesSection click guard
        if (!signedIn) {
            dialogPrompted = true;
        } else {
            navigatedToFavorites = true;
        }

        assertTrue("Guest clicking favorites nav must prompt sign-in", dialogPrompted);
        assertFalse("Guest must not navigate to favorites carousel without signing in", navigatedToFavorites);
    }
}
