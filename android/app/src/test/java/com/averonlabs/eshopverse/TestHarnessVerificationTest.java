package com.averonlabs.eshopverse;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import androidx.arch.core.executor.testing.InstantTaskExecutorRule;
import androidx.lifecycle.MutableLiveData;

import java.io.IOException;

import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;
import okhttp3.mockwebserver.MockResponse;
import okhttp3.mockwebserver.MockWebServer;
import org.junit.Rule;
import org.junit.Test;

/** Verifies the JUnit, Mockito, MockWebServer, LiveData, and shared-fixture test harness. */
public class TestHarnessVerificationTest {

    @Rule
    public InstantTaskExecutorRule instantTaskExecutorRule = new InstantTaskExecutorRule();

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

    @Test
    public void mockWebServer_servesEnqueuedFixtureOverHttp() throws IOException {
        try (MockWebServer server = new MockWebServer()) {
            String fixture = ApiFixtureLoader.load("listCategories", "success");
            server.enqueue(new MockResponse()
                    .setResponseCode(200)
                    .setHeader("Content-Type", "application/json")
                    .setBody(fixture));
            server.start();

            OkHttpClient client = new OkHttpClient();
            Request request = new Request.Builder()
                    .url(server.url("/api/v1/categories"))
                    .build();

            try (Response response = client.newCall(request).execute()) {
                assertTrue(response.isSuccessful());
                assertNotNull(response.body());
                String responseBody = response.body().string();
                assertEquals(fixture, responseBody);
            }
        }
    }

    @Test
    public void liveData_instantTaskExecutorRule_updatesSynchronouslyOnJvm() {
        MutableLiveData<String> liveData = new MutableLiveData<>();
        liveData.setValue("harness_ready");

        assertEquals("harness_ready", liveData.getValue());
    }

    private interface GreetingSource {
        String greeting();
    }
}

