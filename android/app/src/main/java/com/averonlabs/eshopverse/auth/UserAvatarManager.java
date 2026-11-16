package com.averonlabs.eshopverse.auth;

import android.content.Context;
import android.content.SharedPreferences;
import android.graphics.Bitmap;
import android.net.Uri;
import android.widget.ImageView;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.annotation.VisibleForTesting;

import com.averonlabs.eshopverse.R;
import com.averonlabs.eshopverse.core.model.User;
import com.bumptech.glide.Glide;
import com.bumptech.glide.load.engine.DiskCacheStrategy;
import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;

/**
 * Manages customer avatar persistence, Google photo URL extraction,
 * and circular image rendering across authentication lifecycles (USER-001).
 */
public final class UserAvatarManager {

    public static final String PREFS_NAME = "eshop_avatar_prefs";
    public static final String KEY_PREFIX_AVATAR = "avatar_user_";
    public static final String KEY_CACHED_USER = "cached_user_profile_json";
    public static final String KEY_LAST_PROFILE_SYNC = "last_profile_sync_millis";

    /**
     * Standard Stale-While-Revalidate TTL (30 minutes) to conserve battery and eliminate redundant network calls.
     */
    public static final long PROFILE_REVALIDATION_INTERVAL_MS = 30 * 60 * 1000L;

    private static final Gson GSON = new Gson();

    private UserAvatarManager() {
        // Utility class
    }

    private static SharedPreferences getPrefs(@NonNull Context context) {
        return context.getApplicationContext().getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
    }

    /**
     * Retrieves the stored avatar local file path or remote Google URL for the given user.
     */
    @Nullable
    public static String getAvatarPath(@NonNull Context context, int userId) {
        if (userId <= 0) return null;
        return getPrefs(context).getString(KEY_PREFIX_AVATAR + userId, null);
    }

    /**
     * Stores a remote Google photo URL for the authenticated user.
     */
    public static void saveGoogleAvatarUrl(@NonNull Context context, int userId, @NonNull String photoUrl) {
        if (userId <= 0 || photoUrl.trim().isEmpty()) return;
        getPrefs(context).edit().putString(KEY_PREFIX_AVATAR + userId, photoUrl.trim()).apply();
    }

    /**
     * Copies an image from an incoming Uri (e.g. Gallery) to app-internal private storage
     * and persists the file path.
     */
    @Nullable
    public static String saveAvatarFromUri(@NonNull Context context, int userId, @NonNull Uri sourceUri) {
        if (userId <= 0) return null;
        File targetFile = new File(context.getApplicationContext().getFilesDir(), "avatar_" + userId + ".jpg");

        try (InputStream inputStream = context.getContentResolver().openInputStream(sourceUri);
             FileOutputStream outputStream = new FileOutputStream(targetFile)) {
            if (inputStream == null) return null;

            byte[] buffer = new byte[8192];
            int read;
            while ((read = inputStream.read(buffer)) != -1) {
                outputStream.write(buffer, 0, read);
            }
            outputStream.flush();

            String filePath = targetFile.getAbsolutePath();
            getPrefs(context).edit().putString(KEY_PREFIX_AVATAR + userId, filePath).apply();
            return filePath;
        } catch (Exception e) {
            return null;
        }
    }

    /**
     * Compresses and saves a Bitmap (e.g. from Camera preview) to app-internal private storage.
     */
    @Nullable
    public static String saveAvatarBitmap(@NonNull Context context, int userId, @NonNull Bitmap bitmap) {
        if (userId <= 0) return null;
        File targetFile = new File(context.getApplicationContext().getFilesDir(), "avatar_" + userId + ".jpg");

        try (FileOutputStream outputStream = new FileOutputStream(targetFile)) {
            bitmap.compress(Bitmap.CompressFormat.JPEG, 90, outputStream);
            outputStream.flush();

            String filePath = targetFile.getAbsolutePath();
            getPrefs(context).edit().putString(KEY_PREFIX_AVATAR + userId, filePath).apply();
            return filePath;
        } catch (Exception e) {
            return null;
        }
    }

    /**
     * Removes the stored avatar reference and deletes any locally saved JPEG file.
     */
    public static void removeAvatar(@NonNull Context context, int userId) {
        if (userId <= 0) return;
        getPrefs(context).edit().remove(KEY_PREFIX_AVATAR + userId).apply();
        try {
            File targetFile = new File(context.getApplicationContext().getFilesDir(), "avatar_" + userId + ".jpg");
            if (targetFile.exists()) {
                targetFile.delete();
            }
        } catch (Exception ignored) {}
    }

    /**
     * Persists the authenticated User model locally for 0ms cold-start rendering
     * and offline continuity until sign-out.
     */
    public static void saveCachedUser(@NonNull Context context, @NonNull User user) {
        try {
            String json = GSON.toJson(user);
            getPrefs(context).edit()
                    .putString(KEY_CACHED_USER, json)
                    .putLong(KEY_LAST_PROFILE_SYNC, System.currentTimeMillis())
                    .apply();
        } catch (Exception ignored) {}
    }

    /**
     * Retrieves the locally cached User for 0ms instant display without network lag.
     */
    @Nullable
    public static User getCachedUser(@NonNull Context context) {
        try {
            String json = getPrefs(context).getString(KEY_CACHED_USER, null);
            if (json == null || json.trim().isEmpty()) {
                return null;
            }
            return GSON.fromJson(json, User.class);
        } catch (Exception e) {
            return null;
        }
    }

    /**
     * Purges cached customer profile on sign-out.
     */
    public static void clearCachedUser(@NonNull Context context) {
        getPrefs(context).edit()
                .remove(KEY_CACHED_USER)
                .remove(KEY_LAST_PROFILE_SYNC)
                .apply();
    }

    /**
     * Determines whether the Stale-While-Revalidate TTL (30 minutes) has elapsed,
     * signaling that a silent background profile refresh is appropriate.
     */
    public static boolean shouldRevalidateProfile(@NonNull Context context) {
        long lastSync = getPrefs(context).getLong(KEY_LAST_PROFILE_SYNC, 0L);
        return (System.currentTimeMillis() - lastSync) > PROFILE_REVALIDATION_INTERVAL_MS;
    }

    /**
     * Records the current timestamp as the latest successful profile revalidation.
     */
    public static void recordProfileRevalidated(@NonNull Context context) {
        getPrefs(context).edit().putLong(KEY_LAST_PROFILE_SYNC, System.currentTimeMillis()).apply();
    }

    /**
     * Extracts the Google profile picture URL from an OpenID Connect ID token JWT payload.
     *
     * @param idToken Raw JWT ID token string.
     * @return Extracted photo URL, or null if not present or malformed.
     */
    @Nullable
    public static String extractPictureUrlFromIdToken(@Nullable String idToken) {
        if (idToken == null || idToken.trim().isEmpty()) {
            return null;
        }

        try {
            String[] parts = idToken.split("\\.");
            if (parts.length >= 2) {
                // java.util.Base64 is available on minSdk 25 through core library desugaring.
                byte[] decoded = java.util.Base64.getUrlDecoder().decode(parts[1]);
                String jsonString = new String(decoded, StandardCharsets.UTF_8);
                JsonObject json = JsonParser.parseString(jsonString).getAsJsonObject();
                if (json.has("picture") && !json.get("picture").isJsonNull()) {
                    String pic = json.get("picture").getAsString();
                    return (pic != null && !pic.trim().isEmpty()) ? pic.trim() : null;
                }
            }
        } catch (Exception ignored) {}
        return null;
    }

    /**
     * Loads the customer avatar into the given ImageView with circular cropping,
     * anti-aliased edges, and placeholder/error fallback.
     */
    public static void loadAvatarInto(@NonNull ImageView imageView, @Nullable String avatarPathOrUrl) {
        if (imageView.getContext() == null) return;

        if (avatarPathOrUrl != null && !avatarPathOrUrl.trim().isEmpty()) {
            try {
                Object loadTarget = avatarPathOrUrl.startsWith("http")
                        ? avatarPathOrUrl.trim()
                        : new File(avatarPathOrUrl.trim());

                Glide.with(imageView.getContext())
                        .load(loadTarget)
                        .circleCrop()
                        .placeholder(R.drawable.bg_avatar_circle)
                        .error(R.drawable.ic_account)
                        .diskCacheStrategy(DiskCacheStrategy.AUTOMATIC)
                        .into(imageView);
                return;
            } catch (Exception ignored) {}
        }

        // Default avatar fallback
        imageView.setImageResource(R.drawable.ic_account);
    }
}
