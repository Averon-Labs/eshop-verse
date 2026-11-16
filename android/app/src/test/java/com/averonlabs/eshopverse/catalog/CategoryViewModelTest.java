package com.averonlabs.eshopverse.catalog;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import androidx.arch.core.executor.testing.InstantTaskExecutorRule;

import com.averonlabs.eshopverse.R;
import com.averonlabs.eshopverse.core.error.ApiErrorCodes;
import com.averonlabs.eshopverse.core.model.Category;
import com.averonlabs.eshopverse.core.model.CategoryStatus;
import com.averonlabs.eshopverse.core.net.ApiException;
import com.averonlabs.eshopverse.core.state.UiState;

import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * JVM unit tests for {@link CategoryViewModel} per Phase 14 Step 1 (CACHE-002).
 * Verifies category caching, 0ms warm-cache return, force-refresh bypass, and category selection.
 */
public class CategoryViewModelTest {

    @Rule
    public InstantTaskExecutorRule instantTaskExecutorRule = new InstantTaskExecutorRule();

    private CatalogRepository repository;
    private CategoryViewModel viewModel;

    private Category createSampleCategory(int id, String name, int sortOrder) {
        return new Category(id, name, sortOrder, CategoryStatus.ACTIVE);
    }

    @Before
    public void setUp() {
        repository = mock(CatalogRepository.class);
        viewModel = new CategoryViewModel(repository);
    }

    @Test
    public void testLoadCategoriesSuccessTransition() {
        List<Category> dummyCategories = new ArrayList<>();
        dummyCategories.add(createSampleCategory(1, "Footwear", 1));
        dummyCategories.add(createSampleCategory(2, "Apparel", 2));

        doAnswer(invocation -> {
            CatalogRepository.CatalogCallback<List<Category>> cb = invocation.getArgument(1);
            cb.onSuccess(dummyCategories);
            return null;
        }).when(repository).listCategories(eq(false), any());

        viewModel.loadCategories();

        UiState<List<Category>> state = viewModel.getCategoriesState().getValue();
        assertNotNull(state);
        assertTrue(state.isContent());
        assertEquals(2, state.getData().size());
        assertEquals("Footwear", state.getData().get(0).getName());
        assertTrue(viewModel.hasData());
    }

    @Test
    public void testWarmCacheReturnsImmediatelyWithoutLoadingState() {
        List<Category> cached = Collections.singletonList(createSampleCategory(1, "Footwear", 1));
        when(repository.hasValidCategoryCache()).thenReturn(true);
        when(repository.getCachedCategories()).thenReturn(cached);

        viewModel.loadCategories();

        UiState<List<Category>> state = viewModel.getCategoriesState().getValue();
        assertNotNull(state);
        assertTrue(state.isContent());
        assertEquals(1, state.getData().size());
        assertEquals("Footwear", state.getData().get(0).getName());

        // Verify repository.listCategories was NOT called because warm cache was returned synchronously
        verify(repository, never()).listCategories(any(Boolean.class), any());
    }

    @Test
    public void testReloadBypassesCacheWithForceRefresh() {
        List<Category> fresh = Collections.singletonList(createSampleCategory(3, "Electronics", 3));

        doAnswer(invocation -> {
            CatalogRepository.CatalogCallback<List<Category>> cb = invocation.getArgument(1);
            cb.onSuccess(fresh);
            return null;
        }).when(repository).listCategories(eq(true), any());

        viewModel.reload();

        verify(repository, times(1)).listCategories(eq(true), any());
        UiState<List<Category>> state = viewModel.getCategoriesState().getValue();
        assertNotNull(state);
        assertTrue(state.isContent());
        assertEquals(1, state.getData().size());
        assertEquals("Electronics", state.getData().get(0).getName());
    }

    @Test
    public void testSelectCategoryUpdatesSelectedId() {
        assertNull(viewModel.getSelectedCategoryId().getValue());

        viewModel.selectCategory(10L);
        assertEquals(Long.valueOf(10L), viewModel.getSelectedCategoryId().getValue());

        viewModel.selectCategory(null);
        assertNull(viewModel.getSelectedCategoryId().getValue());
    }

    @Test
    public void testErrorTransition() {
        ApiException exception = new ApiException(500, ApiErrorCodes.INTERNAL_ERROR, "Server Error", Collections.emptyMap());

        doAnswer(invocation -> {
            CatalogRepository.CatalogCallback<List<Category>> cb = invocation.getArgument(1);
            cb.onError(exception);
            return null;
        }).when(repository).listCategories(eq(false), any());

        viewModel.loadCategories();

        UiState<List<Category>> state = viewModel.getCategoriesState().getValue();
        assertNotNull(state);
        assertTrue(state.isError());
    }
}
