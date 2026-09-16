package com.flashcards.card;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.nio.file.Files;
import java.nio.file.Path;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

class LocalCardImageStoreTest {

    @TempDir
    Path tempDir;

    @Test
    void roundTripsBytes() {
        LocalCardImageStore store = new LocalCardImageStore(properties());
        store.createRoot();
        byte[] bytes = {1, 2, 3, 4};
        store.put("card-images/abc/front.jpg", bytes);
        assertArrayEquals(bytes, store.get("card-images/abc/front.jpg").orElseThrow());
        store.delete("card-images/abc/front.jpg");
        assertTrue(store.get("card-images/abc/front.jpg").isEmpty());
    }

    private CardImageProperties properties() {
        return new CardImageProperties("local", tempDir.toString(), "", "us-east-1", "", "card-images", 5_000_000, 1600);
    }
}
