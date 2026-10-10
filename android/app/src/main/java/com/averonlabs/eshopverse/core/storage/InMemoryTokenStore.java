package com.averonlabs.eshopverse.core.storage;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import java.util.Objects;

/**
 * In-memory implementation of {@link TokenStore} for unit testing and test harnesses.
 * Token values are redacted in {@link #toString()}.
 */
public final class InMemoryTokenStore implements TokenStore {

    public interface TimeProvider {
        long currentTimeMillis();
    }

    private final TimeProvider timeProvider;
    private AuthToken storedToken;

    public InMemoryTokenStore() {
        this(System::currentTimeMillis);
    }

    public InMemoryTokenStore(@NonNull TimeProvider timeProvider) {
        this.timeProvider = Objects.requireNonNull(timeProvider, "timeProvider cannot be null");
    }

    @Override
    public synchronized void save(@NonNull String token, @NonNull String expiresAt) {
        this.storedToken = new AuthToken(token, expiresAt);
    }

    @Nullable
    @Override
    public synchronized AuthToken read() {
        return storedToken;
    }

    @Override
    public synchronized void clear() {
        this.storedToken = null;
    }

    @Override
    public synchronized boolean isExpired() {
        if (storedToken == null) {
            return true;
        }
        return TokenExpirationHelper.isExpired(storedToken.getExpiresAt(), timeProvider.currentTimeMillis());
    }

    @Nullable
    @Override
    public synchronized String getToken() {
        if (isExpired()) {
            return null;
        }
        return storedToken != null ? storedToken.getToken() : null;
    }

    @NonNull
    @Override
    public synchronized String toString() {
        return "InMemoryTokenStore{hasToken=" + (storedToken != null) + ", isExpired=" + isExpired() + "}";
    }
}
