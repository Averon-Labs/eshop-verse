package com.averonlabs.eshopverse;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;

/** Loads the shared API fixtures from the JVM test classpath. */
final class ApiFixtureLoader {

    private ApiFixtureLoader() { }

    static String load(String operationId, String scenario) throws IOException {
        if (!isSafePathSegment(operationId) || !isSafePathSegment(scenario)) {
            throw new IllegalArgumentException("Fixture path segments must be simple names");
        }

        String resourcePath = "fixtures/api/" + operationId + "/" + scenario + ".json";
        try (InputStream stream = ApiFixtureLoader.class.getClassLoader()
                .getResourceAsStream(resourcePath)) {
            if (stream == null) {
                throw new IOException("Missing API fixture: " + resourcePath);
            }
            return new String(stream.readAllBytes(), StandardCharsets.UTF_8);
        }
    }

    private static boolean isSafePathSegment(String value) {
        return value != null && value.matches("[A-Za-z0-9_-]+");
    }
}
