package com.flashcards.translate;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Map;

import org.springframework.http.HttpStatus;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.flashcards.common.ApiException;

/**
 * Paused self-hosted translator. Not a Spring bean.
 * Card translation currently uses {@link TranslateService} (Azure).
 * To turn this back on, see README “LibreTranslate (paused)”.
 *
 * <p>Argos has no model for Welsh ({@code cy}) or Swahili ({@code sw}).
 * Hong Kong Chinese maps to written traditional Chinese ({@code zt}), not spoken Cantonese.
 * Brazilian Portuguese maps to {@code pb}.
 */
public final class LibreTranslateClient {

    private static final Map<String, String> ARGOS = Map.ofEntries(
            Map.entry("en-US", "en"),
            Map.entry("zh-CN", "zh"),
            Map.entry("zh-HK", "zt"),
            Map.entry("hi-IN", "hi"),
            Map.entry("es-ES", "es"),
            Map.entry("ar-SA", "ar"),
            Map.entry("fr-FR", "fr"),
            Map.entry("bn-IN", "bn"),
            Map.entry("pt-BR", "pb"),
            Map.entry("ru-RU", "ru"),
            Map.entry("id-ID", "id"),
            Map.entry("de-DE", "de"),
            Map.entry("ja-JP", "ja"),
            Map.entry("tr-TR", "tr"),
            Map.entry("vi-VN", "vi"),
            Map.entry("ko-KR", "ko"),
            Map.entry("it-IT", "it"),
            Map.entry("th-TH", "th"),
            Map.entry("pl-PL", "pl"),
            Map.entry("nl-NL", "nl"),
            Map.entry("uk-UA", "uk"),
            Map.entry("sv-SE", "sv"),
            Map.entry("el-GR", "el"),
            Map.entry("he-IL", "he"),
            Map.entry("ga-IE", "ga"),
            Map.entry("da-DK", "da"),
            Map.entry("fi-FI", "fi"),
            Map.entry("cs-CZ", "cs"),
            Map.entry("ro-RO", "ro"),
            Map.entry("tl-PH", "tl"),
            Map.entry("nb-NO", "nb"),
            Map.entry("hu-HU", "hu"));

    private final TranslateProperties properties;
    private final ObjectMapper json = new ObjectMapper();
    private final HttpClient http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build();

    public LibreTranslateClient(TranslateProperties properties) {
        this.properties = properties;
    }

    public static String argosCode(String speechCode) {
        if (speechCode == null) {
            return null;
        }
        return ARGOS.get(speechCode);
    }

    public static boolean canTranslate(String frontLanguage, String backLanguage) {
        String source = argosCode(frontLanguage);
        String target = argosCode(backLanguage);
        return source != null && target != null && !source.equals(target);
    }

    public String translate(String text, String sourceLanguage, String targetLanguage) {
        String value = text == null ? "" : text.trim();
        if (value.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Enter text to translate");
        }
        if (value.length() > TranslateService.MAX_CHARS) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "That text is too long to translate");
        }
        if (!canTranslate(sourceLanguage, targetLanguage)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Translation is not available for that language");
        }
        String source = argosCode(sourceLanguage);
        String target = argosCode(targetLanguage);
        try {
            String body = json.writeValueAsString(Map.of(
                    "q", value,
                    "source", source,
                    "target", target,
                    "format", "text"));
            HttpRequest request = HttpRequest.newBuilder(URI.create(properties.libreBaseUrl() + "/translate"))
                    .timeout(Duration.ofSeconds(30))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(body, StandardCharsets.UTF_8))
                    .build();
            HttpResponse<String> response = http.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
            if (response.statusCode() >= 400) {
                throw unavailableOrUnsupported(response.body());
            }
            JsonNode node = json.readTree(response.body());
            String translated = node.path("translatedText").asText("").trim();
            if (translated.isEmpty()) {
                throw new ApiException(HttpStatus.BAD_GATEWAY, TranslateService.UNAVAILABLE);
            }
            return translated;
        } catch (ApiException ex) {
            throw ex;
        } catch (IOException | InterruptedException ex) {
            if (ex instanceof InterruptedException) {
                Thread.currentThread().interrupt();
            }
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, TranslateService.UNAVAILABLE);
        }
    }

    private ApiException unavailableOrUnsupported(String body) {
        String message = body == null ? "" : body.toLowerCase();
        if (message.contains("language") || message.contains("not supported")) {
            return new ApiException(HttpStatus.BAD_REQUEST, "Translation is not available for that language");
        }
        return new ApiException(HttpStatus.BAD_GATEWAY, TranslateService.UNAVAILABLE);
    }
}
