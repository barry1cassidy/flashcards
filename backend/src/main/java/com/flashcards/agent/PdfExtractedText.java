package com.flashcards.agent;

public record PdfExtractedText(String filename, String text, int pageCount, int pagesUsed, boolean truncated) {
}
