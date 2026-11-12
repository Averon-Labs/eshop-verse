package com.averonlabs.eshopverse.core.state;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import java.util.Objects;

/**
 * Used as a wrapper for data that is exposed via LiveData that represents an event.
 * Ensures the content is handled only once.
 *
 * @param <T> Content type.
 */
public class Event<T> {

    @NonNull
    private final T content;
    private boolean hasBeenHandled = false;

    public Event(@NonNull T content) {
        this.content = Objects.requireNonNull(content, "content cannot be null");
    }

    /**
     * Returns the content and prevents its use again.
     */
    @Nullable
    public T getContentIfNotHandled() {
        if (hasBeenHandled) {
            return null;
        } else {
            hasBeenHandled = true;
            return content;
        }
    }

    /**
     * Returns the content, even if it's already been handled.
     */
    @NonNull
    public T peekContent() {
        return content;
    }

    public boolean hasBeenHandled() {
        return hasBeenHandled;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Event<?> event = (Event<?>) o;
        return hasBeenHandled == event.hasBeenHandled && content.equals(event.content);
    }

    @Override
    public int hashCode() {
        return Objects.hash(content, hasBeenHandled);
    }
}
