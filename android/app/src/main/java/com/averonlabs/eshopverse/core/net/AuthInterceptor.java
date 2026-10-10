package com.averonlabs.eshopverse.core.net;

import androidx.annotation.NonNull;

import com.averonlabs.eshopverse.core.storage.TokenStore;

import java.io.IOException;
import java.util.Objects;

import okhttp3.Interceptor;
import okhttp3.Request;
import okhttp3.Response;

/**
 * Attaches the bearer token from {@link TokenStore} to outgoing requests when present.
 * The token is never logged or exposed.
 */
public final class AuthInterceptor implements Interceptor {

    private final TokenStore tokenStore;

    public AuthInterceptor(@NonNull TokenStore tokenStore) {
        this.tokenStore = Objects.requireNonNull(tokenStore, "tokenStore cannot be null");
    }

    @NonNull
    @Override
    public Response intercept(@NonNull Chain chain) throws IOException {
        Request original = chain.request();

        // If authorization header already manually supplied, do not override
        if (original.header("Authorization") != null) {
            return chain.proceed(original);
        }

        String token = tokenStore.getToken();
        if (token != null && !token.trim().isEmpty()) {
            Request authenticated = original.newBuilder()
                    .header("Authorization", "Bearer " + token)
                    .build();
            return chain.proceed(authenticated);
        }

        return chain.proceed(original);
    }
}
