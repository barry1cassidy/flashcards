package com.flashcards.common;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.util.HashSet;
import java.util.Set;

import org.junit.jupiter.api.Test;

class CopyNamesTest {

    @Test
    void keepsOriginalWhenFree() {
        assertEquals("Spanish Verbs", CopyNames.unique("Spanish Verbs", 200, name -> false));
    }

    @Test
    void appendsCopyNumbersWhenTaken() {
        Set<String> taken = new HashSet<>();
        taken.add("Spanish Verbs");
        taken.add("Spanish Verbs (copy 1)");
        String name = CopyNames.unique("Spanish Verbs", 200, taken::contains);
        assertEquals("Spanish Verbs (copy 2)", name);
    }

    @Test
    void clipsLongNamesToFitSuffix() {
        String base = "A".repeat(80);
        String name = CopyNames.unique(base, 80, n -> n.equals(base));
        assertEquals(80, name.length());
        assertEquals(" (copy 1)", name.substring(name.length() - 9));
    }
}
