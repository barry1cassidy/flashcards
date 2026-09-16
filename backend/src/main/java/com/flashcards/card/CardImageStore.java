package com.flashcards.card;

import java.util.Optional;

interface CardImageStore {

    void put(String key, byte[] bytes);

    Optional<byte[]> get(String key);

    void delete(String key);
}
