package com.averonlabs.eshopverse.core.state;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.annotation.StringRes;

import java.util.Objects;

/**
 * Encapsulates the UI state representation for ViewModel streams:
 * LOADING, CONTENT, EMPTY, and ERROR.
 *
 * @param <T> Type of the loaded content.
 */
public final class UiState<T> {

    public enum Status {
        LOADING,
        CONTENT,
        EMPTY,
        ERROR
    }

    @NonNull
    private final Status status;
    @Nullable
    private final T data;
    @StringRes
    private final int messageRes;
    private final boolean retryable;

    private UiState(@NonNull Status status, @Nullable T data, @StringRes int messageRes, boolean retryable) {
        this.status = Objects.requireNonNull(status, "status cannot be null");
        this.data = data;
        this.messageRes = messageRes;
        this.retryable = retryable;
    }

    @NonNull
    public static <T> UiState<T> loading() {
        return new UiState<>(Status.LOADING, null, 0, false);
    }

    @NonNull
    public static <T> UiState<T> content(@NonNull T data) {
        Objects.requireNonNull(data, "data cannot be null for content state");
        return new UiState<>(Status.CONTENT, data, 0, false);
    }

    @NonNull
    public static <T> UiState<T> empty() {
        return new UiState<>(Status.EMPTY, null, 0, false);
    }

    @NonNull
    public static <T> UiState<T> error(@StringRes int messageRes, boolean retryable) {
        return new UiState<>(Status.ERROR, null, messageRes, retryable);
    }

    @NonNull
    public Status getStatus() {
        return status;
    }

    public boolean isLoading() {
        return status == Status.LOADING;
    }

    public boolean isContent() {
        return status == Status.CONTENT;
    }

    public boolean isEmpty() {
        return status == Status.EMPTY;
    }

    public boolean isError() {
        return status == Status.ERROR;
    }

    @Nullable
    public T getData() {
        return data;
    }

    @StringRes
    public int getMessageRes() {
        return messageRes;
    }

    public boolean isRetryable() {
        return retryable;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        UiState<?> uiState = (UiState<?>) o;
        return messageRes == uiState.messageRes &&
                retryable == uiState.retryable &&
                status == uiState.status &&
                Objects.equals(data, uiState.data);
    }

    @Override
    public int hashCode() {
        return Objects.hash(status, data, messageRes, retryable);
    }

    @NonNull
    @Override
    public String toString() {
        return "UiState{" +
                "status=" + status +
                ", data=" + data +
                ", messageRes=" + messageRes +
                ", retryable=" + retryable +
                '}';
    }
}
