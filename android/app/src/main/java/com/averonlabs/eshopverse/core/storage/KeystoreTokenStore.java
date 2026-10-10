package com.averonlabs.eshopverse.core.storage;

import android.content.Context;
import android.content.SharedPreferences;
import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;
import android.util.Base64;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.KeyStore;
import java.security.KeyStoreException;
import java.security.NoSuchAlgorithmException;
import java.security.cert.CertificateException;
import java.util.Objects;

import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;

/**
 * Production implementation of {@link TokenStore} backed by the Android KeyStore and AES-256-GCM.
 * Hardware-backed key material protects the bearer token from external extraction.
 * Backed by private SharedPreferences explicitly excluded from cloud backup and device transfer.
 * The token is NEVER printed to logs, crash dumps, or {@link #toString()}.
 */
public final class KeystoreTokenStore implements TokenStore {

    private static final String TAG = "KeystoreTokenStore";
    private static final String ANDROID_KEYSTORE_PROVIDER = "AndroidKeyStore";
    private static final String KEY_ALIAS = "eshopverse_auth_key";
    private static final String PREFS_NAME = "eshopverse_secure_tokens";
    private static final String PREF_CIPHER = "pref_key_token_cipher";
    private static final String PREF_IV = "pref_key_token_iv";
    private static final String PREF_EXPIRES_AT = "pref_key_expires_at";
    private static final String CIPHER_TRANSFORMATION = "AES/GCM/NoPadding";
    private static final int GCM_TAG_LENGTH_BITS = 128;

    private final SharedPreferences preferences;
    private final KeyStore keyStore;

    public KeystoreTokenStore(@NonNull Context context) {
        Objects.requireNonNull(context, "context cannot be null");
        this.preferences = context.getApplicationContext().getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        try {
            this.keyStore = KeyStore.getInstance(ANDROID_KEYSTORE_PROVIDER);
            this.keyStore.load(null);
        } catch (KeyStoreException | CertificateException | NoSuchAlgorithmException | IOException e) {
            throw new IllegalStateException("Failed to initialize Android KeyStore", e);
        }
    }

    @Override
    public synchronized void save(@NonNull String token, @NonNull String expiresAt) {
        Objects.requireNonNull(token, "token cannot be null");
        Objects.requireNonNull(expiresAt, "expiresAt cannot be null");

        try {
            SecretKey secretKey = getOrCreateSecretKey();
            Cipher cipher = Cipher.getInstance(CIPHER_TRANSFORMATION);
            cipher.init(Cipher.ENCRYPT_MODE, secretKey);

            byte[] iv = cipher.getIV();
            byte[] cipherText = cipher.doFinal(token.getBytes(StandardCharsets.UTF_8));

            String encodedCipher = Base64.encodeToString(cipherText, Base64.NO_WRAP);
            String encodedIv = Base64.encodeToString(iv, Base64.NO_WRAP);

            preferences.edit()
                    .putString(PREF_CIPHER, encodedCipher)
                    .putString(PREF_IV, encodedIv)
                    .putString(PREF_EXPIRES_AT, expiresAt)
                    .apply();
        } catch (GeneralSecurityException | IOException e) {
            Log.e(TAG, "Secure token encryption failed");
            clear();
        }
    }

    @Nullable
    @Override
    public synchronized AuthToken read() {
        String encodedCipher = preferences.getString(PREF_CIPHER, null);
        String encodedIv = preferences.getString(PREF_IV, null);
        String expiresAt = preferences.getString(PREF_EXPIRES_AT, null);

        if (encodedCipher == null || encodedIv == null || expiresAt == null) {
            return null;
        }

        try {
            SecretKey secretKey = getSecretKey();
            if (secretKey == null) {
                clear();
                return null;
            }

            byte[] cipherText = Base64.decode(encodedCipher, Base64.NO_WRAP);
            byte[] iv = Base64.decode(encodedIv, Base64.NO_WRAP);

            Cipher cipher = Cipher.getInstance(CIPHER_TRANSFORMATION);
            GCMParameterSpec spec = new GCMParameterSpec(GCM_TAG_LENGTH_BITS, iv);
            cipher.init(Cipher.DECRYPT_MODE, secretKey, spec);

            byte[] plainTextBytes = cipher.doFinal(cipherText);
            String plainToken = new String(plainTextBytes, StandardCharsets.UTF_8);

            return new AuthToken(plainToken, expiresAt);
        } catch (GeneralSecurityException | IllegalArgumentException e) {
            Log.e(TAG, "Secure token decryption failed; clearing compromised or invalid credentials");
            clear();
            return null;
        }
    }

    @Override
    public synchronized void clear() {
        preferences.edit()
                .remove(PREF_CIPHER)
                .remove(PREF_IV)
                .remove(PREF_EXPIRES_AT)
                .apply();
    }

    @Override
    public synchronized boolean isExpired() {
        AuthToken token = read();
        if (token == null) {
            return true;
        }
        return TokenExpirationHelper.isExpired(token.getExpiresAt(), System.currentTimeMillis());
    }

    @Nullable
    @Override
    public synchronized String getToken() {
        if (isExpired()) {
            return null;
        }
        AuthToken token = read();
        return token != null ? token.getToken() : null;
    }

    @NonNull
    @Override
    public synchronized String toString() {
        boolean hasToken = preferences.contains(PREF_CIPHER);
        return "KeystoreTokenStore{hasStoredToken=" + hasToken + ", isExpired=" + isExpired() + "}";
    }

    private SecretKey getOrCreateSecretKey() throws GeneralSecurityException, IOException {
        SecretKey existingKey = getSecretKey();
        if (existingKey != null) {
            return existingKey;
        }

        KeyGenerator keyGenerator = KeyGenerator.getInstance(
                KeyProperties.KEY_ALGORITHM_AES,
                ANDROID_KEYSTORE_PROVIDER
        );

        KeyGenParameterSpec keyGenParameterSpec = new KeyGenParameterSpec.Builder(
                KEY_ALIAS,
                KeyProperties.PURPOSE_ENCRYPT | KeyProperties.PURPOSE_DECRYPT
        )
                .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
                .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
                .setKeySize(256)
                .build();

        keyGenerator.init(keyGenParameterSpec);
        return keyGenerator.generateKey();
    }

    @Nullable
    private SecretKey getSecretKey() {
        try {
            if (!keyStore.containsAlias(KEY_ALIAS)) {
                return null;
            }
            KeyStore.Entry entry = keyStore.getEntry(KEY_ALIAS, null);
            if (entry instanceof KeyStore.SecretKeyEntry) {
                return ((KeyStore.SecretKeyEntry) entry).getSecretKey();
            }
            return null;
        } catch (GeneralSecurityException e) {
            return null;
        }
    }
}
