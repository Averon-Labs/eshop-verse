package com.averonlabs.eshopverse.core.net;

import androidx.annotation.NonNull;

import java.io.IOException;

import okhttp3.Interceptor;
import okhttp3.Request;
import okhttp3.Response;

/**
 * Enforces the API retry policy:
 * - Safe GET requests may retry once on network failure or 5xx server error.
 * - Mutating requests (POST, PATCH, PUT, DELETE) are NEVER retried automatically
 *   to guarantee duplicate-submission safety.
 */
public final class RetryInterceptor implements Interceptor {

    @NonNull
    @Override
    public Response intercept(@NonNull Chain chain) throws IOException {
        Request request = chain.request();
        boolean isSafeGet = "GET".equalsIgnoreCase(request.method());

        try {
            Response response = chain.proceed(request);
            if (isSafeGet && response.code() >= 500) {
                response.close();
                return chain.proceed(request);
            }
            return response;
        } catch (IOException e) {
            if (isSafeGet) {
                return chain.proceed(request);
            }
            throw e;
        }
    }
}
