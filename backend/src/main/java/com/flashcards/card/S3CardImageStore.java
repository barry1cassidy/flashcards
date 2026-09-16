package com.flashcards.card;

import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;

import com.flashcards.common.ApiException;

import software.amazon.awssdk.core.exception.SdkException;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.NoSuchKeyException;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

class S3CardImageStore implements CardImageStore, AutoCloseable {

    private static final Logger log = LoggerFactory.getLogger(S3CardImageStore.class);

    private final S3Client s3;
    private final String bucket;

    S3CardImageStore(S3Client s3, CardImageProperties properties) {
        this.s3 = s3;
        this.bucket = properties.bucket();
        if (bucket.isBlank()) {
            throw new IllegalStateException("Set CARD_IMAGES_S3_BUCKET when CARD_IMAGES_STORAGE=s3");
        }
    }

    @Override
    public void put(String key, byte[] bytes) {
        try {
            s3.putObject(
                    PutObjectRequest.builder()
                            .bucket(bucket)
                            .key(key)
                            .contentType("image/jpeg")
                            .build(),
                    RequestBody.fromBytes(bytes));
        } catch (SdkException ex) {
            log.error("Could not save card image to S3 {}", key, ex);
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Could not save image");
        }
    }

    @Override
    public Optional<byte[]> get(String key) {
        try {
            return Optional.of(s3.getObjectAsBytes(
                            GetObjectRequest.builder().bucket(bucket).key(key).build())
                    .asByteArray());
        } catch (NoSuchKeyException ex) {
            return Optional.empty();
        } catch (SdkException ex) {
            log.warn("Could not read card image from S3 {}", key, ex);
            return Optional.empty();
        }
    }

    @Override
    public void delete(String key) {
        try {
            s3.deleteObject(DeleteObjectRequest.builder().bucket(bucket).key(key).build());
        } catch (SdkException ex) {
            log.warn("Could not delete card image from S3 {}", key, ex);
        }
    }

    @Override
    public void close() {
        s3.close();
    }
}
