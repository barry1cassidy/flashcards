package com.flashcards.translate;

import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.flashcards.common.ApiException;

@Service
public class TranslateService {

    static final int MAX_CHARS = 4000;
    static final String UNAVAILABLE = "Translation is not available right now.";

    private final TranslateProperties properties;
    private final ObjectMapper json = new ObjectMapper();
    private final HttpClient http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build();

    public TranslateService(TranslateProperties properties) {
        this.properties = properties;
    }

    public String translate(String text, String sourceLanguage, String targetLanguage) {
        String value = text == null ? "" : text.trim();
        if (value.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Enter text to translate");
        }
        if (value.length() > MAX_CHARS) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "That text is too long to translate");
        }
        if (!TranslationLanguages.canTranslate(sourceLanguage, targetLanguage)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Translation is not available for that language");
        }
        if (properties.azureKey().isEmpty()) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, UNAVAILABLE);
        }
        String source = TranslationLanguages.azureCode(sourceLanguage);
        String target = TranslationLanguages.azureCode(targetLanguage);
        try {
            String body = json.writeValueAsString(List.of(Map.of("text", value)));
            String uri = properties.azureEndpoint()
                    + "/translate?api-version=3.0&from="
                    + URLEncoder.encode(source, StandardCharsets.UTF_8)
                    + "&to="
                    + URLEncoder.encode(target, StandardCharsets.UTF_8);
            HttpRequest.Builder request = HttpRequest.newBuilder(URI.create(uri))
                    .timeout(Duration.ofSeconds(30))
                    .header("Content-Type", "application/json")
                    .header("Ocp-Apim-Subscription-Key", properties.azureKey())
                    .POST(HttpRequest.BodyPublishers.ofString(body, StandardCharsets.UTF_8));
            if (!properties.azureRegion().isEmpty()) {
                request.header("Ocp-Apim-Subscription-Region", properties.azureRegion());
            }
            HttpResponse<String> response = http.send(request.build(), HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
            if (response.statusCode() >= 400) {
                throw failure(response.statusCode(), response.body());
            }
            JsonNode node = json.readTree(response.body());
            String translated = node.path(0).path("translations").path(0).path("text").asText("").trim();
            if (translated.isEmpty()) {
                throw new ApiException(HttpStatus.BAD_GATEWAY, UNAVAILABLE);
            }
            return translated;
        } catch (ApiException ex) {
            throw ex;
        } catch (IOException | InterruptedException ex) {
            if (ex instanceof InterruptedException) {
                Thread.currentThread().interrupt();
            }
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, UNAVAILABLE);
        }
    }

    private ApiException failure(int status, String body) {
        String message = body == null ? "" : body.toLowerCase();
        if (status == 429 || status == 403 || message.contains("quota")) {
            return new ApiException(HttpStatus.SERVICE_UNAVAILABLE, UNAVAILABLE);
        }
        if (message.contains("language") || message.contains("not supported")) {
            return new ApiException(HttpStatus.BAD_REQUEST, "Translation is not available for that language");
        }
        return new ApiException(HttpStatus.BAD_GATEWAY, UNAVAILABLE);
    }
}
