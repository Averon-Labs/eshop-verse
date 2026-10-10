package com.averonlabs.eshopverse.core.net;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.averonlabs.eshopverse.core.model.Pagination;
import com.averonlabs.eshopverse.core.state.Paged;
import com.google.gson.annotations.SerializedName;

import java.util.Collections;
import java.util.List;

/**
 * Generic response envelope for paginated collection payloads: { "data": List<T>, "pagination": Pagination }.
 *
 * @param <T> Item type.
 */
public final class PagedResponse<T> {

    @SerializedName("data")
    private final List<T> data;

    @SerializedName("pagination")
    private final Pagination pagination;

    public PagedResponse(@Nullable List<T> data, @Nullable Pagination pagination) {
        this.data = data != null ? data : Collections.emptyList();
        this.pagination = pagination;
    }

    @NonNull
    public List<T> getData() {
        return data != null ? data : Collections.emptyList();
    }

    @Nullable
    public Pagination getPagination() {
        return pagination;
    }

    /**
     * Determines whether there are more pages to fetch.
     *
     * @return true if currentPage < totalPages.
     */
    public boolean hasMore() {
        if (pagination == null) {
            return false;
        }
        return pagination.getCurrentPage() < pagination.getTotalPages();
    }

    /**
     * Maps this network envelope to the domain UI state primitive {@link Paged}.
     *
     * @return A {@link Paged} state object.
     */
    @NonNull
    public Paged<T> toPaged() {
        int current = pagination != null ? pagination.getCurrentPage() : 1;
        int perPage = pagination != null ? pagination.getPerPage() : getData().size();
        int totalItems = pagination != null ? pagination.getTotalItems() : getData().size();
        int totalPages = pagination != null ? pagination.getTotalPages() : 1;
        return new Paged<>(getData(), current, perPage, totalItems, totalPages);
    }
}
