package com.averonlabs.eshopverse.auth;

import android.os.Bundle;

import androidx.annotation.NonNull;
import androidx.credentials.Credential;
import androidx.credentials.CredentialManager;
import androidx.credentials.CustomCredential;
import androidx.credentials.GetCredentialRequest;
import androidx.credentials.GetCredentialResponse;
import androidx.credentials.exceptions.GetCredentialCancellationException;
import androidx.credentials.exceptions.GetCredentialInterruptedException;
import androidx.credentials.exceptions.GetCredentialProviderConfigurationException;
import androidx.credentials.exceptions.GetCredentialUnsupportedException;
import androidx.credentials.exceptions.NoCredentialException;

import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential;

import org.junit.Before;
import org.junit.Test;
import org.mockito.Mockito;

import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;

/**
 * Unit tests for GoogleAuthManager (AUTH-007).
 *
 * <p>Failures are asserted through {@link GoogleAuthManager.GoogleAuthFailure} so the
 * tests pin the classification that decides which actionable message a screen shows.</p>
 */
public class GoogleAuthManagerTest {

    private static final String TEST_CLIENT_ID = "test-server-client-id.apps.googleusercontent.com";
    private CredentialManager mockCredentialManager;
    private GoogleAuthManager googleAuthManager;

    @Before
    public void setUp() {
        mockCredentialManager = Mockito.mock(CredentialManager.class);
        googleAuthManager = new GoogleAuthManager(mockCredentialManager, TEST_CLIENT_ID);
    }

    private GoogleAuthManager.GoogleAuthCallback failureCallback(AtomicReference<GoogleAuthManager.GoogleAuthFailure> ref) {
        return new GoogleAuthManager.GoogleAuthCallback() {
            @Override
            public void onSuccess(@NonNull String idToken) {}

            @Override
            public void onCancelled() {
                ref.set(GoogleAuthManager.GoogleAuthFailure.CANCELLED);
            }

            @Override
            public void onError(@NonNull GoogleAuthManager.GoogleAuthFailure failure) {
                ref.set(failure);
            }
        };
    }

    @Test
    public void testServerClientIdPreserved() {
        assertEquals(TEST_CLIENT_ID, googleAuthManager.getServerClientId());
    }

    @Test
    public void testBuildCredentialRequestBuildsCorrectRequest() {
        GetCredentialRequest request = googleAuthManager.buildCredentialRequest();
        assertNotNull(request);
        assertEquals(1, request.getCredentialOptions().size());
    }

    @Test
    public void testHandleCredentialErrorCancellationInvokesOnCancelled() {
        AtomicBoolean cancelled = new AtomicBoolean(false);
        AtomicBoolean errorCalled = new AtomicBoolean(false);

        GetCredentialCancellationException cancelException = new GetCredentialCancellationException("User cancelled");

        googleAuthManager.handleCredentialError(cancelException, new GoogleAuthManager.GoogleAuthCallback() {
            @Override
            public void onSuccess(@NonNull String idToken) {}

            @Override
            public void onCancelled() {
                cancelled.set(true);
            }

            @Override
            public void onError(@NonNull GoogleAuthManager.GoogleAuthFailure failure) {
                errorCalled.set(true);
            }
        });

        assertTrue(cancelled.get());
        assertTrue(!errorCalled.get());
    }

    @Test
    public void testHandleCredentialErrorNoCredentialReportsNoCredential() {
        AtomicReference<GoogleAuthManager.GoogleAuthFailure> failureRef = new AtomicReference<>();

        NoCredentialException noCredException = new NoCredentialException("No credential available");

        googleAuthManager.handleCredentialError(noCredException, failureCallback(failureRef));

        assertEquals(GoogleAuthManager.GoogleAuthFailure.NO_CREDENTIAL, failureRef.get());
    }

    @Test
    public void testClassifyPlayServicesMessageReportsPlayServicesUnavailable() {
        assertEquals(
                GoogleAuthManager.GoogleAuthFailure.PLAY_SERVICES_UNAVAILABLE,
                GoogleAuthManager.classify(new NoCredentialException(
                        "Google Play services is not available on this device"))
        );
    }

    @Test
    public void testClassifyConfigurationIssueReportsNotConfigured() {
        assertEquals(
                GoogleAuthManager.GoogleAuthFailure.NOT_CONFIGURED,
                GoogleAuthManager.classify(new GetCredentialProviderConfigurationException(
                        "Provider configuration is invalid"))
        );
    }

    @Test
    public void testClassifyDeveloperConsoleMessageReportsNotConfigured() {
        // An unregistered package name/SHA-1 pair surfaces as this Google error.
        assertEquals(
                GoogleAuthManager.GoogleAuthFailure.NOT_CONFIGURED,
                GoogleAuthManager.classify(new NoCredentialException(
                        "[28444] Developer console is not set up correctly."))
        );
    }

    @Test
    public void testClassifyCancellationReportsCancelled() {
        assertEquals(
                GoogleAuthManager.GoogleAuthFailure.CANCELLED,
                GoogleAuthManager.classify(new GetCredentialCancellationException("User cancelled"))
        );
    }

    @Test
    public void testClassifyUnsupportedReportsUnsupported() {
        assertEquals(
                GoogleAuthManager.GoogleAuthFailure.UNSUPPORTED,
                GoogleAuthManager.classify(new GetCredentialUnsupportedException("Unsupported"))
        );
    }

    @Test
    public void testClassifyInterruptedReportsInterrupted() {
        assertEquals(
                GoogleAuthManager.GoogleAuthFailure.INTERRUPTED,
                GoogleAuthManager.classify(new GetCredentialInterruptedException("Interrupted"))
        );
    }

    @Test
    public void testClassifyUnrecognizedErrorReportsUnknown() {
        assertEquals(GoogleAuthManager.GoogleAuthFailure.UNKNOWN, GoogleAuthManager.classify(null));
    }

    @Test
    public void testMessageResForEveryFailureIsNonZero() {
        for (GoogleAuthManager.GoogleAuthFailure failure : GoogleAuthManager.GoogleAuthFailure.values()) {
            assertTrue("Missing message resource for " + failure,
                    GoogleAuthManager.messageResFor(failure) != 0);
        }
    }

    @Test
    public void testHandleCredentialResponseNullReportsFailure() {
        AtomicReference<GoogleAuthManager.GoogleAuthFailure> failureRef = new AtomicReference<>();

        googleAuthManager.handleCredentialResponse(null, failureCallback(failureRef));

        assertNotNull(failureRef.get());
    }

    @Test
    public void testHandleCredentialResponseUnexpectedTypeReportsUnexpectedCredential() {
        AtomicReference<GoogleAuthManager.GoogleAuthFailure> failureRef = new AtomicReference<>();

        Credential mockCredential = Mockito.mock(Credential.class);
        Mockito.when(mockCredential.getType()).thenReturn("unexpected_credential_type");

        GetCredentialResponse response = new GetCredentialResponse(mockCredential);

        googleAuthManager.handleCredentialResponse(response, failureCallback(failureRef));

        assertEquals(GoogleAuthManager.GoogleAuthFailure.UNEXPECTED_CREDENTIAL, failureRef.get());
    }

    @Test
    public void testHandleCredentialResponseValidGoogleIdTokenInvokesOnSuccess() {
        AtomicReference<String> successTokenRef = new AtomicReference<>();

        GoogleAuthManager testManager = new GoogleAuthManager(mockCredentialManager, TEST_CLIENT_ID) {
            @Override
            protected String extractIdToken(@NonNull Credential credential) {
                return "mock.jwt.token";
            }
        };

        CustomCredential customCredential = new CustomCredential(
                GoogleIdTokenCredential.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL,
                new Bundle()
        );

        GetCredentialResponse response = new GetCredentialResponse(customCredential);

        testManager.handleCredentialResponse(response, new GoogleAuthManager.GoogleAuthCallback() {
            @Override
            public void onSuccess(@NonNull String idToken) {
                successTokenRef.set(idToken);
            }

            @Override
            public void onCancelled() {}

            @Override
            public void onError(@NonNull GoogleAuthManager.GoogleAuthFailure failure) {}
        });

        assertEquals("mock.jwt.token", successTokenRef.get());
    }

    @Test
    public void testHandleCredentialResponseEmptyTokenReportsEmptyToken() {
        AtomicReference<GoogleAuthManager.GoogleAuthFailure> failureRef = new AtomicReference<>();

        GoogleAuthManager testManager = new GoogleAuthManager(mockCredentialManager, TEST_CLIENT_ID) {
            @Override
            protected String extractIdToken(@NonNull Credential credential) {
                return "";
            }
        };

        CustomCredential customCredential = new CustomCredential(
                GoogleIdTokenCredential.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL,
                new Bundle()
        );

        GetCredentialResponse response = new GetCredentialResponse(customCredential);

        testManager.handleCredentialResponse(response, failureCallback(failureRef));

        assertEquals(GoogleAuthManager.GoogleAuthFailure.EMPTY_TOKEN, failureRef.get());
    }

    @Test
    public void testHandleCredentialResponseParsingExceptionReportsParseFailed() {
        AtomicReference<GoogleAuthManager.GoogleAuthFailure> failureRef = new AtomicReference<>();

        GoogleAuthManager testManager = new GoogleAuthManager(mockCredentialManager, TEST_CLIENT_ID) {
            @Override
            protected String extractIdToken(@NonNull Credential credential) throws Exception {
                throw new RuntimeException("Malformed payload");
            }
        };

        CustomCredential customCredential = new CustomCredential(
                GoogleIdTokenCredential.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL,
                new Bundle()
        );

        GetCredentialResponse response = new GetCredentialResponse(customCredential);

        testManager.handleCredentialResponse(response, failureCallback(failureRef));

        assertEquals(GoogleAuthManager.GoogleAuthFailure.PARSE_FAILED, failureRef.get());
    }
}
