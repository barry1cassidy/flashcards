package com.flashcards.card;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;

import com.flashcards.common.ApiException;

class LocalCardImageStore implements CardImageStore {

    private static final Logger log = LoggerFactory.getLogger(LocalCardImageStore.class);

    private final Path root;

    LocalCardImageStore(CardImageProperties properties) {
        this.root = Path.of(properties.dir()).toAbsolutePath().normalize();
    }

    void createRoot() {
        try {
            Files.createDirectories(root);
        } catch (IOException ex) {
            throw new IllegalStateException("Could not create card image directory: " + root, ex);
        }
    }

    @Override
    public void put(String key, byte[] bytes) {
        Path path = pathFor(key);
        try {
            Files.createDirectories(path.getParent());
            Files.write(path, bytes);
        } catch (IOException ex) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Could not save image");
        }
    }

    @Override
    public Optional<byte[]> get(String key) {
        Path path = pathFor(key);
        if (!Files.isRegularFile(path)) {
            return Optional.empty();
        }
        try {
            return Optional.of(Files.readAllBytes(path));
        } catch (IOException ex) {
            log.warn("Could not read card image {}", path, ex);
            return Optional.empty();
        }
    }

    @Override
    public void delete(String key) {
        Path path = pathFor(key);
        try {
            Files.deleteIfExists(path);
        } catch (IOException ex) {
            log.warn("Could not delete card image {}", path, ex);
        }
    }

    private Path pathFor(String key) {
        Path resolved = root.resolve(key).normalize();
        if (!resolved.startsWith(root)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid card image side");
        }
        return resolved;
    }
}
