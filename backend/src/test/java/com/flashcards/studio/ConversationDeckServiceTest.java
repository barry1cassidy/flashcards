package com.flashcards.studio;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

import java.util.List;

import org.junit.jupiter.api.Test;

import com.flashcards.card.CardRequest;

class ConversationDeckServiceTest {

    @Test
    void phrasesUseTheNativeLineOnTheFrontAndSkipSpeakers() {
        List<CardRequest> cards = ConversationDeckService.phrases(List.of(
                turn("you", "You", "A coffee, please.", "Un café, por favor."),
                turn("you", "You", "A coffee, please.", "Un café, por favor."),
                turn("them", "Barista", "  ", "Hola"),
                turn("them", "Barista", "Here you go.", "Aquí tiene.")));

        assertEquals(2, cards.size());
        assertEquals("A coffee, please.", cards.get(0).front());
        assertEquals("Un café, por favor.", cards.get(0).back());
        assertNull(cards.get(0).hint());
        assertEquals("Here you go.", cards.get(1).front());
        assertEquals("Aquí tiene.", cards.get(1).back());
    }

    private static LanguageTurn turn(String role, String speaker, String nativeText, String targetText) {
        LanguageTurn turn = new LanguageTurn();
        turn.setRole(LanguageTurnRole.valueOf(role.toUpperCase()));
        turn.setSpeaker(speaker);
        turn.setNativeText(nativeText);
        turn.setTargetText(targetText);
        return turn;
    }
}
