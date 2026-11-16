package com.averonlabs.eshopverse.catalog;

import android.content.Context;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.annotation.VisibleForTesting;
import androidx.lifecycle.ViewModel;
import androidx.lifecycle.ViewModelProvider;

import android.content.SharedPreferences;

import com.averonlabs.eshopverse.core.net.ApiClient;
import com.averonlabs.eshopverse.core.storage.KeystoreTokenStore;
import com.google.gson.Gson;

/**
 * Factory for creating catalog ViewModel instances: {@link CatalogListViewModel},
 * {@link CategoryViewModel}, and {@link ProductDetailViewModel}.
 */
public class CatalogViewModelFactory implements ViewModelProvider.Factory {

    private static final String CATALOG_CACHE_PREFS = "eshop_catalog_cache_prefs";
    private static volatile CatalogRepository sDefaultRepository;

    private final CatalogRepository repository;

    public static synchronized CatalogRepository getDefaultRepository(@NonNull Context context) {
        if (sDefaultRepository == null) {
            Context appContext = context.getApplicationContext();
            ApiClient apiClient = new ApiClient(new KeystoreTokenStore(appContext), null);
            SharedPreferences cachePrefs = appContext.getSharedPreferences(CATALOG_CACHE_PREFS, Context.MODE_PRIVATE);
            sDefaultRepository = new CatalogRepository(apiClient.getRoutes(), cachePrefs, new Gson());
        }
        return sDefaultRepository;
    }

    @VisibleForTesting
    public static synchronized void setDefaultRepository(@Nullable CatalogRepository repository) {
        sDefaultRepository = repository;
    }

    public CatalogViewModelFactory(@NonNull Context context) {
        this(getDefaultRepository(context));
    }

    public CatalogViewModelFactory(@NonNull CatalogRepository repository) {
        this.repository = repository;
    }

    @NonNull
    @Override
    @SuppressWarnings("unchecked")
    public <T extends ViewModel> T create(@NonNull Class<T> modelClass) {
        if (modelClass.isAssignableFrom(CatalogListViewModel.class)) {
            return (T) new CatalogListViewModel(repository);
        } else if (modelClass.isAssignableFrom(CategoryViewModel.class)) {
            return (T) new CategoryViewModel(repository);
        } else if (modelClass.isAssignableFrom(ProductDetailViewModel.class)) {
            return (T) new ProductDetailViewModel(repository);
        }
        throw new IllegalArgumentException("Unknown ViewModel class: " + modelClass.getName());
    }
}
