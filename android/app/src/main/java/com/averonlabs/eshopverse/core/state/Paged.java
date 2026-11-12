package com.averonlabs.eshopverse.core.state;

import androidx.annotation.NonNull;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Objects;

/**
 * Encapsulates a paginated list of items along with pagination metadata.
 *
 * @param <T> Item type.
 */
public final class Paged<T> {

    @NonNull
    private final List<T> items;
    private final int currentPage;
    private final int perPage;
    private final int totalItems;
    private final int totalPages;

    public Paged(@NonNull List<T> items, int currentPage, int perPage, int totalItems, int totalPages) {
        this.items = Collections.unmodifiableList(new ArrayList<>(Objects.requireNonNull(items, "items cannot be null")));
        this.currentPage = currentPage;
        this.perPage = perPage;
        this.totalItems = totalItems;
        this.totalPages = totalPages;
    }

    @NonNull
    public List<T> getItems() {
        return items;
    }

    public int getCurrentPage() {
        return currentPage;
    }

    public int getPerPage() {
        return perPage;
    }

    public int getTotalItems() {
        return totalItems;
    }

    public int getTotalPages() {
        return totalPages;
    }

    public boolean hasMore() {
        return currentPage < totalPages;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Paged<?> paged = (Paged<?>) o;
        return currentPage == paged.currentPage &&
                perPage == paged.perPage &&
                totalItems == paged.totalItems &&
                totalPages == paged.totalPages &&
                items.equals(paged.items);
    }

    @Override
    public int hashCode() {
        return Objects.hash(items, currentPage, perPage, totalItems, totalPages);
    }
}
