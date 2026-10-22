package com.flashcards.studio;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

class StudioSampleLanguagesTest {

    @Test
    void allowsEnglishWithIrish() {
        assertTrue(StudioSampleLanguages.supportedPair("ga-IE", "en-US"));
        assertTrue(StudioSampleLanguages.supportedPair("en-US", "ga-IE"));
    }

    @Test
    void rejectsPairsWithoutEnglish() {
        assertFalse(StudioSampleLanguages.supportedPair("es-ES", "fr-FR"));
        assertFalse(StudioSampleLanguages.supportedPair("en-US", "en-US"));
        assertFalse(StudioSampleLanguages.supportedPair("sv-SE", "en-US"));
    }
}
