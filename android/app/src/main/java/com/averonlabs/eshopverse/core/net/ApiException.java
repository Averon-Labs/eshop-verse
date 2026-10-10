package com.averonlabs.eshopverse.core.net;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import java.io.IOException;
import java.util.Collections;
import java.util.Map;
import java.util.Objects;

/**
 * Typed API exception carrying the HTTP status, machine-readable error code,
 * user message, and optional field validation errors.
 */
public final class ApiException extends IOException {

    private final int httpStatus;
    private final String code;
    private final Map<String, String> fieldErrors;

    public ApiException(int httpStatus, @NonNull String code, @NonNull String message, @Nullable Map<String, String> fieldErrors) {
        super(message);
        this.httpStatus = httpStatus;
        this.code = Objects.requireNonNull(code, "code cannot be null");
        this.fieldErrors = fieldErrors != null ? Collections.unmodifiableMap(fieldErrors) : Collections.emptyMap();
    }

    public int getHttpStatus() {
        return httpStatus;
    }

    @NonNull
    public String getCode() {
        return code;
    }

    @NonNull
    public Map<String, String> getFieldErrors() {
        return fieldErrors;
    }

    @NonNull
    @Override
    public String toString() {
        return "ApiException{" +
                "httpStatus=" + httpStatus +
                ", code='" + code + '\'' +
                ", message='" + getMessage() + '\'' +
                ", fieldErrors=" + fieldErrors +
                '}';
    }
}
