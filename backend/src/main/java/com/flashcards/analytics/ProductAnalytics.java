package com.flashcards.analytics;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import jakarta.annotation.PreDestroy;

@Service
public class ProductAnalytics {

    private static final Logger log = LoggerFactory.getLogger(ProductAnalytics.class);

    private final PostHogProperties properties;
    private final HttpClient http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(3)).build();
    private ExecutorService executor;

    public ProductAnalytics(PostHogProperties properties) {
        this.properties = properties;
    }

    public static ProductAnalytics disabled() {
        return new ProductAnalytics(new PostHogProperties("", "https://us.i.posthog.com"));
    }

    public void accountCreated(UUID userId, String method) {
        capture(userId, "account_created", Map.of("method", method));
    }

    public void deckSaved(UUID userId, String frontLanguage, String backLanguage, String source) {
        capture(userId, "deck_saved", Map.of(
                "front_language", text(frontLanguage),
                "back_language", text(backLanguage),
                "source", text(source)));
    }

    public void sampleSaved(UUID userId, String sampleId, String frontLanguage, String backLanguage, String source) {
        capture(userId, "sample_saved", Map.of(
                "sample_id", text(sampleId),
                "front_language", text(frontLanguage),
                "back_language", text(backLanguage),
                "source", text(source)));
    }

    @PreDestroy
    void shutdown() {
        if (executor != null) {
            executor.shutdown();
        }
    }

    private ExecutorService executor() {
        if (executor == null) {
            executor = Executors.newVirtualThreadPerTaskExecutor();
        }
        return executor;
    }

    private void capture(UUID userId, String event, Map<String, String> fields) {
        if (!properties.enabled() || userId == null) {
            return;
        }
        String body = payload(userId, event, fields);
        URI uri = URI.create(properties.captureUrl());
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    sendAsync(uri, body, event);
                }
            });
            return;
        }
        sendAsync(uri, body, event);
    }

    private void sendAsync(URI uri, String body, String event) {
        executor().execute(() -> {
            try {
                HttpRequest request = HttpRequest.newBuilder(uri)
                        .timeout(Duration.ofSeconds(5))
                        .header("Content-Type", "application/json")
                        .POST(HttpRequest.BodyPublishers.ofString(body, StandardCharsets.UTF_8))
                        .build();
                HttpResponse<String> response = http.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
                if (response.statusCode() >= 300) {
                    log.warn("PostHog rejected {} ({})", event, response.statusCode());
                }
            } catch (InterruptedException ex) {
                Thread.currentThread().interrupt();
                log.warn("PostHog request interrupted for {}", event);
            } catch (Exception ex) {
                log.warn("PostHog request failed for {}", event);
            }
        });
    }

    private String payload(UUID userId, String event, Map<String, String> fields) {
        StringBuilder body = new StringBuilder();
        body.append("\"$process_person_profile\":true");
        for (Map.Entry<String, String> entry : fields.entrySet()) {
            body.append(",\"").append(json(entry.getKey())).append("\":\"").append(json(entry.getValue())).append('"');
        }
        return "{"
                + "\"api_key\":\"" + json(properties.apiKey().trim()) + "\","
                + "\"event\":\"" + json(event) + "\","
                + "\"distinct_id\":\"" + json(userId.toString()) + "\","
                + "\"properties\":{" + body + "}"
                + "}";
    }

    private static String text(String value) {
        return value == null ? "" : value;
    }

    private static String json(String value) {
        return text(value)
                .replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r");
    }
}
