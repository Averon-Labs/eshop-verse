package com.averonlabs.eshopverse;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.io.IOException;

import org.junit.Test;

/** Verifies the JUnit, Mockito, and shared-fixture test harness. */
public class TestHarnessVerificationTest {

    @Test
    public void fixtureLoader_contractFixture_readsFromTestClasspath() throws IOException {
        String body = ApiFixtureLoader.load("listCategories", "success");

        assertTrue(body.contains("\"name\": \"Footwear\""));
        assertTrue(body.contains("\"status\": \"active\""));
    }

    @Test
    public void mockito_stubbedDependency_returnsConfiguredValue() {
        GreetingSource source = mock(GreetingSource.class);
        when(source.greeting()).thenReturn("EShop Verse");

        assertEquals("EShop Verse", source.greeting());
        verify(source).greeting();
    }

    @Test(expected = IOException.class)
    public void fixtureLoader_missingFixture_reportsMissingResource() throws IOException {
        ApiFixtureLoader.load("listCategories", "missing");
    }

    private interface GreetingSource {
        String greeting();
    }
}
