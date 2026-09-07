package com.flashcards.card;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import org.junit.jupiter.api.Test;

import com.flashcards.common.ApiException;
import com.flashcards.user.UserLocale;

class CardLanguagesTest {

    @Test
    void mapsUserLocaleAndPrefixes() {
        assertEquals("es-ES", CardLanguages.fromUserLocale(UserLocale.ES));
        assertEquals("en-US", CardLanguages.fromUserLocale(UserLocale.EN));
        assertEquals("es-ES", CardLanguages.normalize("es", CardLanguages.DEFAULT));
        assertEquals("ja-JP", CardLanguages.normalize("ja-JP", CardLanguages.DEFAULT));
        assertEquals("sv-SE", CardLanguages.normalize("sv", CardLanguages.DEFAULT));
        assertEquals("el-GR", CardLanguages.normalize("el-GR", CardLanguages.DEFAULT));
        assertEquals("he-IL", CardLanguages.normalize("he", CardLanguages.DEFAULT));
    }

    @Test
    void rejectsUnknownLanguage() {
        assertThrows(ApiException.class, () -> CardLanguages.normalize("zz-ZZ", CardLanguages.DEFAULT));
        assertEquals("en-US", CardLanguages.normalizeOrFallback("zz-ZZ", CardLanguages.DEFAULT));
    }
}
