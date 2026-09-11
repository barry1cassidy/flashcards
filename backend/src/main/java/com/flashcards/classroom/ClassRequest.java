package com.flashcards.classroom;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ClassRequest(@NotBlank @Size(max = 120) String name) {}
