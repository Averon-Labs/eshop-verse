package com.averonlabs.eshopverse.core.net;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.averonlabs.eshopverse.core.error.ApiErrorCodes;
import com.averonlabs.eshopverse.core.model.ErrorEnvelope;
import com.google.gson.Gson;
import com.google.gson.JsonSyntaxException;

import java.util.HashMap;
import java.util.Map;

/**
 * Parses API error responses into typed {@link ApiException} instances.
 * Extracts documented error codes, human messages, and field-level validation details.
 */
public final class ApiErrorMapper {

    private static final Gson GSON = new Gson();

    private ApiErrorMapper() {}

    /**
     * Maps an HTTP response status and body string into an {@link ApiException}.
     *
     * @param httpStatus       The HTTP status code.
     * @param responseBodyJson The JSON response body.
     * @return A typed {@link ApiException}.
     */
    @NonNull
    public static ApiException map(int httpStatus, @Nullable String responseBodyJson) {
        if (responseBodyJson != null && !responseBodyJson.trim().isEmpty()) {
            try {
                ErrorEnvelope envelope = GSON.fromJson(responseBodyJson, ErrorEnvelope.class);
                if (envelope != null && envelope.getError() != null) {
                    ErrorEnvelope.ErrorPayload payload = envelope.getError();
                    Map<String, String> fieldErrors = new HashMap<>();
                    if (payload.getDetails() != null) {
                        for (ErrorEnvelope.Detail detail : payload.getDetails()) {
                            if (detail.getField() != null && detail.getMessage() != null) {
                                fieldErrors.put(detail.getField(), detail.getMessage());
                            }
                        }
                    }
                    return new ApiException(
                            httpStatus,
                            payload.getCode(),
                            payload.getMessage(),
                            fieldErrors
                    );
                }
            } catch (JsonSyntaxException ignored) {
                // If not valid JSON, use fallback below
            }
        }

        String fallbackCode = fallbackCodeForStatus(httpStatus);
        String fallbackMessage = "Request failed with HTTP " + httpStatus;
        return new ApiException(httpStatus, fallbackCode, fallbackMessage, null);
    }

    @NonNull
    public static String fallbackCodeForStatus(int httpStatus) {
        switch (httpStatus) {
            case 401:
                return ApiErrorCodes.UNAUTHENTICATED;
            case 403:
                return ApiErrorCodes.FORBIDDEN;
            case 404:
                return ApiErrorCodes.NOT_FOUND;
            case 409:
                return ApiErrorCodes.CONFLICT;
            case 422:
                return ApiErrorCodes.VALIDATION_ERROR;
            case 429:
                return ApiErrorCodes.RATE_LIMITED;
            default:
                return ApiErrorCodes.INTERNAL_ERROR;
        }
    }
}
