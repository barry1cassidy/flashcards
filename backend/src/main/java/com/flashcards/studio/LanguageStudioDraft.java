package com.flashcards.studio;

import java.util.List;

public record LanguageStudioDraft(String title, String yourRole, String theirRole, List<Turn> turns) {

    public record Turn(LanguageTurnRole role, String speaker, String nativeText, String targetText) {
    }
}
