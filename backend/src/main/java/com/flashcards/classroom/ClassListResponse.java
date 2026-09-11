package com.flashcards.classroom;

import java.util.List;

public record ClassListResponse(List<ClassSummary> teaching, List<ClassSummary> joined) {}
