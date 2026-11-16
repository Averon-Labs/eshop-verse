package com.averonlabs.eshopverse.auth;

import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.net.Uri;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;

/**
 * High-performance, client-side downscaling and compression engine for avatar uploads.
 * <p>
 * Implements the Instagram/Telegram media pipeline pattern: modern smartphone camera
 * photos (12-48MP, 3-10MB) are downscaled to an optimal avatar resolution (512x512)
 * and compressed into high-efficiency JPEG bytes (~40-90KB) BEFORE network transmission.
 * This eliminates multi-second upload hangs, conserves user mobile data, and enables
 * near-instant profile photo synchronization.
 */
public final class AvatarImageCompressor {

    public static final int DEFAULT_MAX_DIMENSION = 512;
    public static final int DEFAULT_JPEG_QUALITY = 85;

    private AvatarImageCompressor() {
        // Utility class
    }

    /**
     * Reads an image Uri, computes an optimal sub-sampling factor to protect memory,
     * downscales to {@value #DEFAULT_MAX_DIMENSION}px, and compresses to high-quality JPEG.
     *
     * @param context Application context to open ContentResolver input streams.
     * @param uri     Image Uri selected by the user.
     * @return Compressed JPEG byte array ready for network payload.
     * @throws IOException If the Uri cannot be opened or decoded.
     */
    @NonNull
    public static byte[] compressAndDownscaleUri(@NonNull Context context, @NonNull Uri uri) throws IOException {
        return compressAndDownscaleUri(context, uri, DEFAULT_MAX_DIMENSION, DEFAULT_JPEG_QUALITY);
    }

    /**
     * Reads an image Uri, downscales to {@code maxDimension}, and compresses to JPEG with {@code quality}.
     */
    @NonNull
    public static byte[] compressAndDownscaleUri(
            @NonNull Context context,
            @NonNull Uri uri,
            int maxDimension,
            int quality
    ) throws IOException {
        // Step 1: Decode bounds only to prevent OutOfMemoryError on multi-megapixel images
        BitmapFactory.Options options = new BitmapFactory.Options();
        options.inJustDecodeBounds = true;
        try (InputStream is = context.getContentResolver().openInputStream(uri)) {
            if (is == null) {
                throw new IOException("Cannot open input stream for avatar URI: " + uri);
            }
            BitmapFactory.decodeStream(is, null, options);
        }

        if (options.outWidth <= 0 || options.outHeight <= 0) {
            throw new IOException("Failed to decode image dimensions from URI: " + uri);
        }

        // Step 2: Compute power-of-two inSampleSize
        int sampleSize = 1;
        int maxActual = Math.max(options.outWidth, options.outHeight);
        while (maxActual / (sampleSize * 2) >= maxDimension) {
            sampleSize *= 2;
        }

        // Step 3: Decode sub-sampled bitmap
        options.inJustDecodeBounds = false;
        options.inSampleSize = sampleSize;
        Bitmap sampledBitmap;
        try (InputStream is = context.getContentResolver().openInputStream(uri)) {
            if (is == null) {
                throw new IOException("Cannot reopen input stream for avatar URI: " + uri);
            }
            sampledBitmap = BitmapFactory.decodeStream(is, null, options);
        }

        if (sampledBitmap == null) {
            throw new IOException("BitmapFactory returned null bitmap for URI: " + uri);
        }

        // Step 4: Scale down precisely if still larger than maxDimension
        return compressBitmap(sampledBitmap, maxDimension, quality, true);
    }

    /**
     * Compresses and optionally downscales an in-memory Bitmap (e.g. from camera thumbnail).
     */
    @NonNull
    public static byte[] compressBitmap(@NonNull Bitmap bitmap) {
        return compressBitmap(bitmap, DEFAULT_MAX_DIMENSION, DEFAULT_JPEG_QUALITY, false);
    }

    /**
     * Compresses and downscales a Bitmap to {@code maxDimension} at {@code quality}.
     *
     * @param bitmap        The source bitmap.
     * @param maxDimension  Max width or height in pixels.
     * @param quality       JPEG compression quality (1-100).
     * @param recycleSource Whether to recycle the input bitmap when done.
     * @return Compressed JPEG byte array.
     */
    @NonNull
    public static byte[] compressBitmap(
            @NonNull Bitmap bitmap,
            int maxDimension,
            int quality,
            boolean recycleSource
    ) {
        Bitmap targetBitmap = bitmap;
        int width = bitmap.getWidth();
        int height = bitmap.getHeight();

        if (width > maxDimension || height > maxDimension) {
            float ratio = Math.min((float) maxDimension / width, (float) maxDimension / height);
            int targetW = Math.max(1, Math.round(width * ratio));
            int targetH = Math.max(1, Math.round(height * ratio));
            targetBitmap = Bitmap.createScaledBitmap(bitmap, targetW, targetH, true);
            if (recycleSource && targetBitmap != bitmap) {
                bitmap.recycle();
            }
        }

        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        targetBitmap.compress(Bitmap.CompressFormat.JPEG, Math.max(1, Math.min(100, quality)), outputStream);

        if (recycleSource) {
            targetBitmap.recycle();
        }

        return outputStream.toByteArray();
    }
}
