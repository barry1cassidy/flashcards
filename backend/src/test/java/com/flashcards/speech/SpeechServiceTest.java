package com.flashcards.speech;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicReference;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;

import com.flashcards.common.ApiException;
import com.sun.net.httpserver.HttpServer;

class SpeechServiceTest {

    @Test
    void speaksIrishOnceAndReusesTheFile() throws Exception {
        AtomicInteger calls = new AtomicInteger();
        AtomicReference<String> body = new AtomicReference<>();
        AtomicReference<String> format = new AtomicReference<>();
        byte[] audio = new byte[64];
        for (int i = 0; i < audio.length; i++) {
            audio[i] = (byte) i;
        }
        HttpServer server = server((exchange) -> {
            calls.incrementAndGet();
            body.set(new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8));
            format.set(exchange.getRequestHeaders().getFirst("X-Microsoft-OutputFormat"));
            exchange.sendResponseHeaders(200, audio.length);
            try (OutputStream out = exchange.getResponseBody()) {
                out.write(audio);
            }
        });
        Path cache = Files.createTempDirectory("zipdeck-speech");
        try {
            SpeechService service = service(server, cache, "test-key", "westus2");
            assertArrayEquals(audio, service.synthesize("Dia  dhuit", "ga-IE"));
            assertArrayEquals(audio, service.synthesize("Dia dhuit", "ga"));
            assertEquals(1, calls.get());
            assertEquals("audio-16khz-128kbitrate-mono-mp3", format.get());
            assertTrue(body.get().contains("ga-IE-OrlaNeural"));
            assertTrue(body.get().contains("Dia dhuit"));
        } finally {
            server.stop(0);
        }
    }

    @Test
    void escapesTextBeforeSendingIt() throws Exception {
        AtomicReference<String> body = new AtomicReference<>();
        byte[] audio = new byte[64];
        HttpServer server = server((exchange) -> {
            body.set(new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8));
            exchange.sendResponseHeaders(200, audio.length);
            try (OutputStream out = exchange.getResponseBody()) {
                out.write(audio);
            }
        });
        Path cache = Files.createTempDirectory("zipdeck-speech");
        try {
            SpeechService service = service(server, cache, "test-key", "westus2");
            service.synthesize("A & B <C>", "ga-IE");
            assertTrue(body.get().contains("A &amp; B &lt;C&gt;"));
        } finally {
            server.stop(0);
        }
    }

    @Test
    void refusesOtherLanguagesAndAMissingKey() throws Exception {
        HttpServer server = server((exchange) -> exchange.sendResponseHeaders(500, -1));
        Path cache = Files.createTempDirectory("zipdeck-speech");
        try {
            SpeechService service = service(server, cache, "test-key", "westus2");
            ApiException language = assertThrows(ApiException.class, () -> service.synthesize("Hello", "en-US"));
            assertEquals(HttpStatus.BAD_REQUEST, language.getStatus());
            SpeechService missing = service(server, cache, "", "westus2");
            ApiException key = assertThrows(ApiException.class, () -> missing.synthesize("Dia duit", "ga-IE"));
            assertEquals(SpeechService.UNAVAILABLE, key.getMessage());
        } finally {
            server.stop(0);
        }
    }

    @Test
    void tellsTheUserWhenTheFreeLimitIsUsedUp() throws Exception {
        HttpServer server = server((exchange) -> {
            byte[] response = "quota".getBytes(StandardCharsets.UTF_8);
            exchange.sendResponseHeaders(429, response.length);
            try (OutputStream out = exchange.getResponseBody()) {
                out.write(response);
            }
        });
        Path cache = Files.createTempDirectory("zipdeck-speech");
        try {
            SpeechService service = service(server, cache, "test-key", "westus2");
            ApiException ex = assertThrows(ApiException.class, () -> service.synthesize("Dia duit", "ga-IE"));
            assertEquals(HttpStatus.SERVICE_UNAVAILABLE, ex.getStatus());
            assertEquals(SpeechService.UNAVAILABLE, ex.getMessage());
        } finally {
            server.stop(0);
        }
    }

    @Test
    void dropsTheLeastRecentlyPlayedClipWhenTheFolderIsFull() throws Exception {
        AtomicInteger calls = new AtomicInteger();
        byte[] audio = new byte[64];
        HttpServer server = server((exchange) -> {
            calls.incrementAndGet();
            exchange.getRequestBody().readAllBytes();
            exchange.sendResponseHeaders(200, audio.length);
            try (OutputStream out = exchange.getResponseBody()) {
                out.write(audio);
            }
        });
        Path cache = Files.createTempDirectory("zipdeck-speech");
        ManualClock clock = new ManualClock();
        try {
            SpeechService service = service(server, cache, "test-key", "westus2", 140, clock);
            service.synthesize("a", "ga-IE");
            clock.tick();
            service.synthesize("b", "ga-IE");
            clock.tick();
            service.synthesize("a", "ga-IE");
            clock.tick();
            service.synthesize("c", "ga-IE");
            assertEquals(3, calls.get());
            service.synthesize("a", "ga-IE");
            assertEquals(3, calls.get());
            service.synthesize("b", "ga-IE");
            assertEquals(4, calls.get());
        } finally {
            server.stop(0);
        }
    }

    private static SpeechService service(HttpServer server, Path cache, String key, String region) {
        return service(server, cache, key, region, 0, Clock.systemUTC());
    }

    private static SpeechService service(HttpServer server, Path cache, String key, String region, long maxBytes, Clock clock) {
        int port = server.getAddress().getPort();
        return new SpeechService(new SpeechProperties(
                key,
                region,
                cache.toString(),
                "http://127.0.0.1:" + port + "/cognitiveservices/v1",
                maxBytes), HttpClient(), clock);
    }

    private static java.net.http.HttpClient HttpClient() {
        return java.net.http.HttpClient.newHttpClient();
    }

    private static final class ManualClock extends Clock {
        private Instant now = Instant.parse("2026-01-01T00:00:00Z");

        void tick() {
            now = now.plusSeconds(30);
        }

        @Override
        public ZoneId getZone() {
            return ZoneOffset.UTC;
        }

        @Override
        public Clock withZone(ZoneId zone) {
            return this;
        }

        @Override
        public Instant instant() {
            return now;
        }
    }

    private static HttpServer server(com.sun.net.httpserver.HttpHandler handler) throws IOException {
        HttpServer server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/cognitiveservices/v1", handler);
        server.start();
        return server;
    }
}
