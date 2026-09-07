package com.flashcards.library;

import java.util.UUID;

public record LibraryGroupRef(UUID id, String slug, String name, String color) {
}
