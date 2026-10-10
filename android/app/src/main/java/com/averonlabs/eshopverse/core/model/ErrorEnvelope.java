package com.averonlabs.eshopverse.core.model;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.google.gson.annotations.SerializedName;

import java.util.Collections;
import java.util.List;

public final class ErrorEnvelope {

    @SerializedName("error")
    private final ErrorPayload error;

    public ErrorEnvelope(@NonNull ErrorPayload error) {
        this.error = error;
    }

    @NonNull
    public ErrorPayload getError() {
        return error;
    }

    public static final class ErrorPayload {
        @SerializedName("code")
        private final String code;

        @SerializedName("message")
        private final String message;

        @SerializedName("details")
        private final List<Detail> details;

        public ErrorPayload(@NonNull String code, @NonNull String message, @Nullable List<Detail> details) {
            this.code = code;
            this.message = message;
            this.details = details != null ? details : Collections.emptyList();
        }

        @NonNull
        public String getCode() {
            return code;
        }

        @NonNull
        public String getMessage() {
            return message;
        }

        @NonNull
        public List<Detail> getDetails() {
            return details != null ? details : Collections.emptyList();
        }
    }

    public static final class Detail {
        @SerializedName("field")
        private final String field;

        @SerializedName("message")
        private final String message;

        public Detail(@NonNull String field, @NonNull String message) {
            this.field = field;
            this.message = message;
        }

        @NonNull
        public String getField() {
            return field;
        }

        @NonNull
        public String getMessage() {
            return message;
        }
    }
}
