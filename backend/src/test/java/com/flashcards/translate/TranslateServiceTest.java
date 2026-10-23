package com.flashcards.translate;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.atomic.AtomicReference;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;

import com.flashcards.common.ApiException;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpServer;

class TranslateServiceTest {

    @Test
    void mapsDeckLanguagesOntoAzureCodes() {
        assertEquals("es", TranslationLanguages.azureCode("es-ES"));
        assertEquals("pt", TranslationLanguages.azureCode("pt-BR"));
        assertEquals("zh-Hant", TranslationLanguages.azureCode("zh-HK"));
        assertEquals("cy", TranslationLanguages.azureCode("cy-GB"));
        assertEquals("sw", TranslationLanguages.azureCode("sw-KE"));
        assertTrue(TranslationLanguages.canTranslate("en-US", "es-ES"));
        assertTrue(TranslationLanguages.canTranslate("zh-CN", "zh-HK"));
        assertTrue(TranslationLanguages.canTranslate("cy-GB", "en-US"));
        assertFalse(TranslationLanguages.canTranslate("en-US", "en-US"));
    }

    @Test
    void fillsFromAzure() throws Exception {
        AtomicReference<String> query = new AtomicReference<>();
        AtomicReference<String> key = new AtomicReference<>();
        HttpServer server = server((exchange) -> {
            query.set(exchange.getRequestURI().getRawQuery());
            key.set(exchange.getRequestHeaders().getFirst("Ocp-Apim-Subscription-Key"));
            byte[] response = "[{\"translations\":[{\"text\":\"Hola\",\"to\":\"es\"}]}]".getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().add("Content-Type", "application/json");
            exchange.sendResponseHeaders(200, response.length);
            try (OutputStream out = exchange.getResponseBody()) {
                out.write(response);
            }
        });
        try {
            TranslateService service = azure(server, "test-key", "");
            assertEquals("Hola", service.translate("Hello", "en-US", "es-ES"));
            assertTrue(query.get().contains("from=en"));
            assertTrue(query.get().contains("to=es"));
            assertEquals("test-key", key.get());
        } finally {
            server.stop(0);
        }
    }

    @Test
    void tellsTheUserWhenTheFreeLimitIsUsedUp() throws Exception {
        HttpServer server = server((exchange) -> {
            byte[] response = "{\"error\":{\"message\":\"Out of call volume quota.\"}}".getBytes(StandardCharsets.UTF_8);
            exchange.sendResponseHeaders(403, response.length);
            try (OutputStream out = exchange.getResponseBody()) {
                out.write(response);
            }
        });
        try {
            TranslateService service = azure(server, "test-key", "eastus");
            ApiException ex = assertThrows(ApiException.class, () -> service.translate("Hello", "en-US", "es-ES"));
            assertEquals(HttpStatus.SERVICE_UNAVAILABLE, ex.getStatus());
            assertEquals(TranslateService.UNAVAILABLE, ex.getMessage());
        } finally {
            server.stop(0);
        }
    }

    @Test
    void tellsTheUserWhenNoKeyIsConfigured() {
        TranslateService service = new TranslateService(new TranslateProperties(
                "http://127.0.0.1:9",
                new TranslateProperties.Azure("", "", "http://127.0.0.1:9")));
        ApiException ex = assertThrows(ApiException.class, () -> service.translate("Hello", "en-US", "es-ES"));
        assertEquals(TranslateService.UNAVAILABLE, ex.getMessage());
    }

    @Test
    void pausedLibreTranslateClientStillFillsFromItsOwnServer() throws Exception {
        assertEquals("pb", LibreTranslateClient.argosCode("pt-BR"));
        assertEquals("zt", LibreTranslateClient.argosCode("zh-HK"));
        assertFalse(LibreTranslateClient.canTranslate("cy-GB", "en-US"));
        HttpServer server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/translate", exchange -> {
            byte[] response = "{\"translatedText\":\"Hola\"}".getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().add("Content-Type", "application/json");
            exchange.sendResponseHeaders(200, response.length);
            try (OutputStream out = exchange.getResponseBody()) {
                out.write(response);
            }
        });
        server.start();
        try {
            int port = server.getAddress().getPort();
            LibreTranslateClient client = new LibreTranslateClient(new TranslateProperties(
                    "http://127.0.0.1:" + port,
                    new TranslateProperties.Azure("", "", "")));
            assertEquals("Hola", client.translate("Hello", "en-US", "es-ES"));
        } finally {
            server.stop(0);
        }
    }

    private static TranslateService azure(HttpServer server, String key, String region) {
        int port = server.getAddress().getPort();
        String endpoint = "http://127.0.0.1:" + port;
        return new TranslateService(new TranslateProperties(
                "http://127.0.0.1:9",
                new TranslateProperties.Azure(key, region, endpoint)));
    }

    private static HttpServer server(HttpHandler handler) throws IOException {
        HttpServer server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/translate", handler);
        server.start();
        return server;
    }
}
