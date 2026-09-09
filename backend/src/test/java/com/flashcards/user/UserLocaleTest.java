package com.flashcards.user;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Test;

class UserLocaleTest {

    @Test
    void mapsCodesAndRegionalTags() {
        assertEquals(UserLocale.EN, UserLocale.fromCode(null));
        assertEquals(UserLocale.ES, UserLocale.fromCode("es"));
        assertEquals(UserLocale.ES, UserLocale.fromCode("es-MX"));
        assertEquals(UserLocale.ZH, UserLocale.fromCode("zh-CN"));
        assertEquals(UserLocale.UK, UserLocale.fromCode("uk-UA"));
        assertEquals(UserLocale.JA, UserLocale.fromCode("ja"));
        assertEquals(UserLocale.EN, UserLocale.fromCode("zz"));
        assertEquals("pt", UserLocale.PT.toCode());
        assertEquals("ar-SA", UserLocale.AR.speechCode());
    }
}
