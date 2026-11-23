package com.flashcards.speech;

import java.io.IOException;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.nio.file.AtomicMoveNotSupportedException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.nio.file.attribute.FileTime;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Clock;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HexFormat;
import java.util.List;
import java.util.Locale;
import java.util.concurrent.ConcurrentHashMap;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import com.flashcards.common.ApiException;

@Service
public class SpeechService {

    static final String VOICE = "ga-IE-OrlaNeural";
    static final String UNAVAILABLE = "Irish speech is not available right now.";
    private static final int MAX_CHARS = 2000;

    private static final Logger log = LoggerFactory.getLogger(SpeechService.class);

    private final SpeechProperties properties;
    private final HttpClient http;
    private final Clock clock;
    private final Object trimLock = new Object();
    private final ConcurrentHashMap<String, Object> locks = new ConcurrentHashMap<>();
    private volatile Path cacheDir;

    public SpeechService(SpeechProperties properties) {
        this(properties, HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build(), Clock.systemUTC());
    }

    SpeechService(SpeechProperties properties, HttpClient http) {
        this(properties, http, Clock.systemUTC());
    }

    SpeechService(SpeechProperties properties, HttpClient http, Clock clock) {
        this.properties = properties;
        this.http = http;
        this.clock = clock;
    }

    public byte[] synthesize(String text, String lang) {
        String value = normalize(text);
        if (value.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Enter text to speak");
        }
        if (value.length() > MAX_CHARS) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "That text is too long to speak");
        }
        if (!irish(lang)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Speech is not available for that language");
        }
        if (properties.key().isEmpty() || properties.speechEndpoint() == null) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, UNAVAILABLE);
        }
        String hash = hash(value);
        Object lock = locks.computeIfAbsent(hash, ignored -> new Object());
        synchronized (lock) {
            Path cached = cacheFile(hash);
            if (cached != null && Files.isRegularFile(cached)) {
                try {
                    byte[] audio = Files.readAllBytes(cached);
                    touch(cached);
                    return audio;
                } catch (IOException ex) {
                    log.warn("Could not read cached Irish speech");
                }
            }
            byte[] audio = requestAudio(value);
            store(cached, audio);
            return audio;
        }
    }

    static boolean irish(String lang) {
        if (lang == null) {
            return false;
        }
        String value = lang.trim().toLowerCase(Locale.ROOT).replace('_', '-');
        return value.equals("ga") || value.equals("ga-ie");
    }

    static String normalize(String text) {
        if (text == null) {
            return "";
        }
        return text.trim().replaceAll("\\s+", " ");
    }

    private byte[] requestAudio(String text) {
        String ssml = "<speak version=\"1.0\" xml:lang=\"ga-IE\">"
                + "<voice name=\"" + VOICE + "\">" + escape(text) + "</voice>"
                + "</speak>";
        HttpRequest request = HttpRequest.newBuilder(properties.speechEndpoint())
                .timeout(Duration.ofSeconds(20))
                .header("Ocp-Apim-Subscription-Key", properties.key())
                .header("Content-Type", "application/ssml+xml")
                .header("X-Microsoft-OutputFormat", "audio-16khz-128kbitrate-mono-mp3")
                .header("User-Agent", "Zipdeck")
                .POST(HttpRequest.BodyPublishers.ofString(ssml, StandardCharsets.UTF_8))
                .build();
        try {
            HttpResponse<byte[]> response = http.send(request, HttpResponse.BodyHandlers.ofByteArray());
            if (response.statusCode() >= 400 || response.body() == null || response.body().length < 32) {
                log.warn("Irish speech request failed with status {}", response.statusCode());
                throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, UNAVAILABLE);
            }
            return response.body();
        } catch (ApiException ex) {
            throw ex;
        } catch (IOException | InterruptedException ex) {
            if (ex instanceof InterruptedException) {
                Thread.currentThread().interrupt();
            }
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, UNAVAILABLE);
        }
    }

    private Path cacheFile(String hash) {
        Path dir = cacheDirectory();
        if (dir == null) {
            return null;
        }
        return dir.resolve(hash + ".mp3");
    }

    private Path cacheDirectory() {
        Path current = cacheDir;
        if (current != null) {
            return current;
        }
        Path preferred = properties.cachePath();
        Path fallback = Path.of(System.getProperty("java.io.tmpdir"), "zipdeck-speech");
        for (Path candidate : new Path[] { preferred, fallback }) {
            try {
                Files.createDirectories(candidate);
                cacheDir = candidate;
                return candidate;
            } catch (IOException ex) {
                log.warn("Could not use speech cache {}", candidate);
            }
        }
        return null;
    }

    private void store(Path dest, byte[] audio) {
        if (dest == null) {
            return;
        }
        Path tmp = dest.resolveSibling(dest.getFileName() + ".part");
        try {
            Files.write(tmp, audio);
            try {
                Files.move(tmp, dest, StandardCopyOption.ATOMIC_MOVE, StandardCopyOption.REPLACE_EXISTING);
            } catch (AtomicMoveNotSupportedException ex) {
                Files.move(tmp, dest, StandardCopyOption.REPLACE_EXISTING);
            }
            touch(dest);
            trim(dest);
        } catch (IOException ex) {
            log.warn("Could not store Irish speech");
            try {
                Files.deleteIfExists(tmp);
            } catch (IOException ignored) {
                // The next phrase can still be spoken.
            }
        }
    }

    private void touch(Path path) {
        try {
            Files.setLastModifiedTime(path, FileTime.from(clock.instant()));
        } catch (IOException ex) {
            log.warn("Could not refresh cached Irish speech");
        }
    }

    private void trim(Path keep) {
        Path dir = keep.getParent();
        if (dir == null) {
            return;
        }
        synchronized (trimLock) {
            long limit = properties.cacheLimit();
            List<CachedFile> files = new ArrayList<>();
            long total = 0;
            try (var stream = Files.list(dir)) {
                for (Path path : stream.toList()) {
                    String name = path.getFileName().toString();
                    if (name.endsWith(".part")) {
                        deleteStalePart(path);
                        continue;
                    }
                    if (!name.endsWith(".mp3") || !Files.isRegularFile(path)) {
                        continue;
                    }
                    long size = Files.size(path);
                    total += size;
                    files.add(new CachedFile(path, size, Files.getLastModifiedTime(path)));
                }
            } catch (IOException ex) {
                log.warn("Could not measure the speech cache");
                return;
            }
            if (total <= limit) {
                return;
            }
            files.sort(Comparator.comparing((CachedFile file) -> file.modified()).thenComparing(file -> file.path().getFileName().toString()));
            for (CachedFile file : files) {
                if (total <= limit) {
                    break;
                }
                if (file.path().equals(keep)) {
                    continue;
                }
                try {
                    if (Files.deleteIfExists(file.path())) {
                        total -= file.size();
                    }
                } catch (IOException ex) {
                    log.warn("Could not remove old Irish speech");
                }
            }
        }
    }

    private void deleteStalePart(Path path) {
        try {
            FileTime modified = Files.getLastModifiedTime(path);
            if (modified.toInstant().isBefore(clock.instant().minus(Duration.ofHours(1)))) {
                Files.deleteIfExists(path);
            }
        } catch (IOException ex) {
            log.warn("Could not remove a partial speech file");
        }
    }

    private record CachedFile(Path path, long size, FileTime modified) {
    }

    private static String hash(String text) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest((VOICE + "\n" + text).getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException(ex);
        }
    }

    private static String escape(String text) {
        StringBuilder out = new StringBuilder(text.length());
        for (int i = 0; i < text.length(); i++) {
            char c = text.charAt(i);
            switch (c) {
                case '&' -> out.append("&amp;");
                case '<' -> out.append("&lt;");
                case '>' -> out.append("&gt;");
                case '"' -> out.append("&quot;");
                case '\'' -> out.append("&apos;");
                default -> {
                    if (c == '\n' || c == '\t' || c >= 0x20) {
                        out.append(c);
                    }
                }
            }
        }
        return out.toString();
    }
}
