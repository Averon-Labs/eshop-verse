package com.averonlabs.eshopverse.core.model;

import com.google.gson.annotations.SerializedName;

import java.util.Objects;

public final class Pagination {

    @SerializedName("currentPage")
    private final int currentPage;

    @SerializedName("perPage")
    private final int perPage;

    @SerializedName("totalItems")
    private final int totalItems;

    @SerializedName("totalPages")
    private final int totalPages;

    public Pagination(int currentPage, int perPage, int totalItems, int totalPages) {
        this.currentPage = currentPage;
        this.perPage = perPage;
        this.totalItems = totalItems;
        this.totalPages = totalPages;
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

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Pagination that = (Pagination) o;
        return currentPage == that.currentPage &&
                perPage == that.perPage &&
                totalItems == that.totalItems &&
                totalPages == that.totalPages;
    }

    @Override
    public int hashCode() {
        return Objects.hash(currentPage, perPage, totalItems, totalPages);
    }
}
