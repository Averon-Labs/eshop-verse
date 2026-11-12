package com.averonlabs.eshopverse.core.net;

/**
 * Global hook invoked upon receiving an HTTP 401 Unauthenticated response from the API.
 * Allows central session management (e.g., clearing secure token store, redirecting to login)
 * without individual screen-level duplication.
 */
public interface UnauthenticatedHandler {

    /**
     * Invoked when an API response indicates an expired, revoked, or invalid session (HTTP 401).
     */
    void onUnauthenticated();
}
