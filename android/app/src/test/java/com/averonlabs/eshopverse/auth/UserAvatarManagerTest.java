package com.averonlabs.eshopverse.auth;

import android.content.Context;
import android.content.SharedPreferences;

import org.junit.Before;
import org.junit.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.nio.charset.StandardCharsets;
import java.util.Base64;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNull;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Unit tests verifying Google photo JWT extraction and avatar preference contracts (USER-001).
 */
public class UserAvatarManagerTest {

    @Mock
    private Context mockContext;

    @Mock
    private Context mockAppContext;

    @Mock
    private SharedPreferences mockPrefs;

    @Mock
    private SharedPreferences.Editor mockEditor;

    @Before
    public void setUp() {
        MockitoAnnotations.openMocks(this);
        when(mockContext.getApplicationContext()).thenReturn(mockAppContext);
        when(mockAppContext.getSharedPreferences(anyString(), anyInt())).thenReturn(mockPrefs);
        when(mockPrefs.edit()).thenReturn(mockEditor);
        when(mockEditor.putString(anyString(), anyString())).thenReturn(mockEditor);
        when(mockEditor.remove(anyString())).thenReturn(mockEditor);
    }

    @Test
    public void test_extractPictureUrlFromIdToken_validToken_returnsUrl() {
        String header = Base64.getUrlEncoder().withoutPadding().encodeToString("{\"alg\":\"RS256\"}".getBytes(StandardCharsets.UTF_8));
        String payloadJson = "{\"sub\":\"1234567890\",\"email\":\"user@eshopverse.com\",\"picture\":\"https://lh3.googleusercontent.com/a/test_profile.jpg\"}";
        String payload = Base64.getUrlEncoder().withoutPadding().encodeToString(payloadJson.getBytes(StandardCharsets.UTF_8));
        String mockJwt = header + "." + payload + ".dummySignature";

        String extracted = UserAvatarManager.extractPictureUrlFromIdToken(mockJwt);
        assertEquals("https://lh3.googleusercontent.com/a/test_profile.jpg", extracted);
    }

    @Test
    public void test_extractPictureUrlFromIdToken_tokenWithoutPicture_returnsNull() {
        String header = Base64.getUrlEncoder().withoutPadding().encodeToString("{\"alg\":\"RS256\"}".getBytes(StandardCharsets.UTF_8));
        String payloadJson = "{\"sub\":\"1234567890\",\"email\":\"user@eshopverse.com\"}";
        String payload = Base64.getUrlEncoder().withoutPadding().encodeToString(payloadJson.getBytes(StandardCharsets.UTF_8));
        String mockJwt = header + "." + payload + ".dummySignature";

        String extracted = UserAvatarManager.extractPictureUrlFromIdToken(mockJwt);
        assertNull(extracted);
    }

    @Test
    public void test_extractPictureUrlFromIdToken_nullOrEmptyToken_returnsNull() {
        assertNull(UserAvatarManager.extractPictureUrlFromIdToken(null));
        assertNull(UserAvatarManager.extractPictureUrlFromIdToken(""));
        assertNull(UserAvatarManager.extractPictureUrlFromIdToken("   "));
        assertNull(UserAvatarManager.extractPictureUrlFromIdToken("invalid_jwt_format"));
    }

    @Test
    public void test_saveGoogleAvatarUrl_storesPref() {
        UserAvatarManager.saveGoogleAvatarUrl(mockContext, 42, "https://lh3.googleusercontent.com/avatar.jpg");
        verify(mockEditor).putString("avatar_user_42", "https://lh3.googleusercontent.com/avatar.jpg");
        verify(mockEditor).apply();
    }

    @Test
    public void test_getAvatarPath_retrievesStoredPref() {
        when(mockPrefs.getString("avatar_user_42", null)).thenReturn("/data/user/0/avatar.jpg");
        String path = UserAvatarManager.getAvatarPath(mockContext, 42);
        assertEquals("/data/user/0/avatar.jpg", path);
    }

    @Test
    public void test_removeAvatar_removesPref() {
        when(mockAppContext.getFilesDir()).thenReturn(new java.io.File(System.getProperty("java.io.tmpdir")));
        UserAvatarManager.removeAvatar(mockContext, 42);
        verify(mockEditor).remove("avatar_user_42");
        verify(mockEditor).apply();
    }
}
