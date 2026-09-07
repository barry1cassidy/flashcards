package com.flashcards.group;

import java.time.Instant;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record GroupRequest(
        @NotBlank @Size(max = 80) String name,
        @NotBlank @Pattern(regexp = "^#[0-9A-Fa-f]{6}$", message = "Color must be a hex value like #2563eb") String color) {
}
