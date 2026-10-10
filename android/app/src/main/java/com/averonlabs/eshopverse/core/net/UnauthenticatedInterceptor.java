package com.averonlabs.eshopverse.core.net;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import java.io.IOException;

import okhttp3.Interceptor;
import okhttp3.Response;

/**
 * Interceptor that intercepts HTTP 401 responses and triggers the shared {@link UnauthenticatedHandler}.
 */
public final class UnauthenticatedInterceptor implements Interceptor {

    private final UnauthenticatedHandler unauthenticatedHandler;

    public UnauthenticatedInterceptor(@Nullable UnauthenticatedHandler unauthenticatedHandler) {
        this.unauthenticatedHandler = unauthenticatedHandler;
    }

    @NonNull
    @Override
    public Response intercept(@NonNull Chain chain) throws IOException {
        Response response = chain.proceed(chain.request());
        if (response.code() == 401 && unauthenticatedHandler != null) {
            unauthenticatedHandler.onUnauthenticated();
        }
        return response;
    }
}
