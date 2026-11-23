package com.flashcards.speech;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SpeechRequest(
        @NotBlank(message = "Enter text to speak") @Size(max = 2000, message = "That text is too long to speak") String text,
        @NotBlank(message = "Choose a language") @Size(max = 16) String lang) {
}
