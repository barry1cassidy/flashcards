package com.flashcards.card;

import java.net.URI;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3ClientBuilder;

@Configuration
@EnableConfigurationProperties(CardImageProperties.class)
public class CardImageConfig {

    @Bean
    CardImageStore cardImageStore(CardImageProperties properties) {
        if (properties.s3()) {
            return new S3CardImageStore(s3Client(properties), properties);
        }
        LocalCardImageStore store = new LocalCardImageStore(properties);
        store.createRoot();
        return store;
    }

    private static S3Client s3Client(CardImageProperties properties) {
        S3ClientBuilder builder = S3Client.builder().region(Region.of(properties.region()));
        if (!properties.endpoint().isBlank()) {
            builder.endpointOverride(URI.create(properties.endpoint())).forcePathStyle(true);
        }
        return builder.build();
    }
}
