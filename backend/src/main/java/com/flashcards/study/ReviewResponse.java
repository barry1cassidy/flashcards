package com.flashcards.study;

import java.time.LocalDate;
import java.util.UUID;

public record ReviewResponse(UUID cardId, LocalDate dueDate, int intervalDays, int repetitions) {
}
