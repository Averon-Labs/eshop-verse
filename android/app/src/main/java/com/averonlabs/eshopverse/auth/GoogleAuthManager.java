package com.averonlabs.eshopverse.auth;

import android.app.Activity;
import android.content.Context;
import android.os.CancellationSignal;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.annotation.StringRes;
import androidx.core.content.ContextCompat;
import androidx.credentials.Credential;
import androidx.credentials.CredentialManager;
import androidx.credentials.CredentialManagerCallback;
import androidx.credentials.CustomCredential;
import androidx.credentials.GetCredentialRequest;
import androidx.credentials.GetCredentialResponse;
import androidx.credentials.exceptions.GetCredentialCancellationException;
import androidx.credentials.exceptions.GetCredentialException;
import androidx.credentials.exceptions.NoCredentialException;

import com.averonlabs.eshopverse.BuildConfig;
import com.averonlabs.eshopverse.R;
import com.google.android.libraries.identity.googleid.GetGoogleIdOption;
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential;

import java.util.Locale;
import java.util.Objects;

/**
 * Coordinates Google Sign-In using Android Credential Manager (AUTH-007).
 * Encapsulates option building, token extraction, and cancellation/error routing.
 *
 * <p>Failures are reported as a {@link GoogleAuthFailure} so each screen can render
 * an actionable string resource. Google sign-in has three distinct failure classes
 * that used to look identical to the user: the device cannot produce a credential
 * (no account or no Google Play services), the build is not registered with Google
 * (package name plus SHA-1 fingerprint missing from the OAuth client), and the
 * credential was obtained but rejected server-side (see
 * {@code auth_error_google_verification_failed} in {@link AuthViewModel}).</p>
 */
public class GoogleAuthManager {

    /**
     * Why Google credential acquisition failed.
     */
    public enum GoogleAuthFailure {
        /** The user dismissed the account picker. */
        CANCELLED,
        /** No usable Google account is available on the device. */
        NO_CREDENTIAL,
        /** Google Play services is missing out of date or unsupported. */
        PLAY_SERVICES_UNAVAILABLE,
        /** This build's package name and/or SHA-1 is not registered with Google. */
        NOT_CONFIGURED,
        /** The credential provider does not support Google ID tokens. */
        UNSUPPORTED,
        /** The request was interrupted before a result was produced. */
        INTERRUPTED,
        /** Google returned a credential type this app cannot consume. */
        UNEXPECTED_CREDENTIAL,
        /** Google returned an empty ID token. */
        EMPTY_TOKEN,
        /** The Google ID token payload could not be parsed. */
        PARSE_FAILED,
        /** Anything else. */
        UNKNOWN
    }

    public interface GoogleAuthCallback {
        void onSuccess(@NonNull String idToken);
        void onCancelled();
        void onError(@NonNull GoogleAuthFailure failure);
    }

    private final CredentialManager credentialManager;
    private final String serverClientId;

    public GoogleAuthManager(@NonNull Context context) {
        this(CredentialManager.create(context), BuildConfig.GOOGLE_WEB_CLIENT_ID);
    }

    public GoogleAuthManager(@NonNull CredentialManager credentialManager, @NonNull String serverClientId) {
        this.credentialManager = Objects.requireNonNull(credentialManager, "credentialManager cannot be null");
        this.serverClientId = Objects.requireNonNull(serverClientId, "serverClientId cannot be null");
    }

    @NonNull
    public String getServerClientId() {
        return serverClientId;
    }

    @NonNull
    public GetCredentialRequest buildCredentialRequest() {
        GetGoogleIdOption googleIdOption = new GetGoogleIdOption.Builder()
                .setFilterByAuthorizedAccounts(false)
                .setServerClientId(serverClientId)
                .setAutoSelectEnabled(false)
                .build();

        return new GetCredentialRequest.Builder()
                .addCredentialOption(googleIdOption)
                .build();
    }

    /**
     * Launches the Google Sign-In dialog via Android Credential Manager.
     */
    public void startSignIn(@NonNull Activity activity, @NonNull GoogleAuthCallback callback) {
        Objects.requireNonNull(activity, "activity cannot be null");
        Objects.requireNonNull(callback, "callback cannot be null");

        GetCredentialRequest request = buildCredentialRequest();
        CancellationSignal cancellationSignal = new CancellationSignal();

        credentialManager.getCredentialAsync(
                activity,
                request,
                cancellationSignal,
                ContextCompat.getMainExecutor(activity),
                new CredentialManagerCallback<GetCredentialResponse, GetCredentialException>() {
                    @Override
                    public void onResult(GetCredentialResponse response) {
                        handleCredentialResponse(response, callback);
                    }

                    @Override
                    public void onError(GetCredentialException e) {
                        handleCredentialError(e, callback);
                    }
                }
        );
    }

    public void handleCredentialResponse(
            @Nullable GetCredentialResponse response,
            @NonNull GoogleAuthCallback callback
    ) {
        if (response == null || response.getCredential() == null) {
            callback.onError(GoogleAuthFailure.UNKNOWN);
            return;
        }

        Credential credential = response.getCredential();
        if (credential instanceof CustomCredential
                && GoogleIdTokenCredential.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL.equals(credential.getType())) {
            try {
                String idToken = extractIdToken(credential);
                if (idToken != null && !idToken.trim().isEmpty()) {
                    callback.onSuccess(idToken);
                } else {
                    callback.onError(GoogleAuthFailure.EMPTY_TOKEN);
                }
            } catch (Exception e) {
                callback.onError(GoogleAuthFailure.PARSE_FAILED);
            }
        } else {
            callback.onError(GoogleAuthFailure.UNEXPECTED_CREDENTIAL);
        }
    }

    protected String extractIdToken(@NonNull Credential credential) throws Exception {
        GoogleIdTokenCredential googleIdToken = GoogleIdTokenCredential.createFrom(credential.getData());
        return googleIdToken.getIdToken();
    }

    public void handleCredentialError(
            @NonNull GetCredentialException e,
            @NonNull GoogleAuthCallback callback
    ) {
        if (e instanceof GetCredentialCancellationException) {
            callback.onCancelled();
            return;
        }

        GoogleAuthFailure failure = classify(e.getType(), e.getMessage());

        if (failure == GoogleAuthFailure.UNKNOWN && e instanceof NoCredentialException) {
            failure = GoogleAuthFailure.NO_CREDENTIAL;
        }

        callback.onError(failure);
    }

    /**
     * Maps a Credential Manager error type/message onto a {@link GoogleAuthFailure}.
     *
     * <p>Matching is done on the exception type and message instead of concrete
     * subclasses so the classification also covers provider-specific errors raised
     * by Google Play services. No credential material is read here.</p>
     */
    @NonNull
    static GoogleAuthFailure classify(@Nullable String exceptionType, @Nullable String exceptionMessage) {
        String type = exceptionType == null ? "" : exceptionType;
        String message = exceptionMessage == null ? "" : exceptionMessage.toLowerCase(Locale.US);

        if (type.contains("USER_CANCELED") || type.contains("CANCEL")) {
            return GoogleAuthFailure.CANCELLED;
        }

        // Checked before NO_CREDENTIAL: a missing or outdated Play services install
        // is reported as "no credential" even when the device has accounts.
        if (message.contains("play services") || message.contains("play store")) {
            return GoogleAuthFailure.PLAY_SERVICES_UNAVAILABLE;
        }

        // Credential Manager reports an unregistered OAuth client (package name and
        // SHA-1 fingerprint) as a provider configuration issue, or as error 28444.
        if (type.contains("CONFIGURATION")
                || message.contains("developer console")
                || message.contains("28444")) {
            return GoogleAuthFailure.NOT_CONFIGURED;
        }

        if (type.contains("NO_CREDENTIAL")) {
            return GoogleAuthFailure.NO_CREDENTIAL;
        }

        if (type.contains("UNSUPPORTED")) {
            return GoogleAuthFailure.UNSUPPORTED;
        }

        if (type.contains("INTERRUPTED")) {
            return GoogleAuthFailure.INTERRUPTED;
        }

        return GoogleAuthFailure.UNKNOWN;
    }

    /**
     * User-facing message for a failure. Every screen renders text from resources only.
     */
    @StringRes
    public static int messageResFor(@NonNull GoogleAuthFailure failure) {
        switch (failure) {
            case CANCELLED:
                return R.string.auth_error_google_cancelled;
            case NO_CREDENTIAL:
                return R.string.auth_error_google_no_credential;
            case PLAY_SERVICES_UNAVAILABLE:
                return R.string.auth_error_google_play_services;
            case NOT_CONFIGURED:
                return R.string.auth_error_google_not_configured;
            case UNSUPPORTED:
                return R.string.auth_error_google_unsupported;
            case INTERRUPTED:
                return R.string.auth_error_google_interrupted;
            case UNEXPECTED_CREDENTIAL:
                return R.string.auth_error_google_unexpected_credential;
            default:
                return R.string.auth_error_google_failed;
        }
    }
}
