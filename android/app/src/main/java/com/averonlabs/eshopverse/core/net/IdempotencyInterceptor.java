package com.averonlabs.eshopverse.core.net;

import androidx.annotation.NonNull;

import java.io.IOException;
import java.util.UUID;

import okhttp3.Interceptor;
import okhttp3.Request;
import okhttp3.Response;

/**
 * Ensures that sensitive mutating operations (order creation and payments) carry an
 * Idempotency-Key header. Automatically assigns a fresh UUID if none was provided by
 * the caller, and preserves an existing key across logical retries.
 */
public final class IdempotencyInterceptor implements Interceptor {

    public static final String HEADER_IDEMPOTENCY_KEY = "Idempotency-Key";

    @NonNull
    @Override
    public Response intercept(@NonNull Chain chain) throws IOException {
        Request request = chain.request();

        if ("POST".equalsIgnoreCase(request.method()) && requiresIdempotencyKey(request)) {
            String existingKey = request.header(HEADER_IDEMPOTENCY_KEY);
            if (existingKey == null || existingKey.trim().isEmpty()) {
                String freshKey = UUID.randomUUID().toString();
                request = request.newBuilder()
                        .header(HEADER_IDEMPOTENCY_KEY, freshKey)
                        .build();
            }
        }

        return chain.proceed(request);
    }

    private boolean requiresIdempotencyKey(@NonNull Request request) {
        String path = request.url().encodedPath();
        return path.endsWith("/orders") || path.contains("/payment");
    }
}
