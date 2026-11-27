package com.flashcards.studio;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;

import com.flashcards.common.ApiException;

class LanguageStudioDraftParserTest {

    @Test
    void parsesFencedJsonAndKeepsSpeakableTurns() {
        LanguageStudioDraft draft = LanguageStudioDraftParser.parse(
                """
                ```json
                {
                  "title": "At the cafe",
                  "yourRole": "customer",
                  "theirRole": "barista",
                  "turns": [
                    {"role": "them", "speaker": "Barista", "native": "Hola", "target": "Hello"},
                    {"role": "you", "speaker": "You", "native": "Un café, por favor", "target": "A coffee, please"},
                    {"role": "them", "speaker": "Barista", "native": "¿Con leche?", "target": "With milk?"},
                    {"role": "you", "speaker": "You", "native": "Sí, con leche", "target": "Yes, with milk"},
                    {"role": "them", "speaker": "Barista", "native": "¿Para aquí?", "target": "For here?"},
                    {"role": "you", "speaker": "You", "native": "Para llevar", "target": "To go"}
                  ]
                }
                ```
                """);
        assertEquals("At the cafe", draft.title());
        assertEquals("customer", draft.yourRole());
        assertEquals(6, draft.turns().size());
        assertEquals(LanguageTurnRole.THEM, draft.turns().get(0).role());
        assertEquals("A coffee, please", draft.turns().get(1).targetText());
    }

    @Test
    void rejectsFewerThanSixTurns() {
        ApiException error = assertThrows(
                ApiException.class,
                () -> LanguageStudioDraftParser.parse(
                        """
                        {"title":"Too short","yourRole":"you","theirRole":"them","turns":[
                          {"role":"them","speaker":"A","native":"n","target":"t"},
                          {"role":"you","speaker":"B","native":"n","target":"t"}
                        ]}
                        """));
        assertEquals(HttpStatus.BAD_REQUEST, error.getStatus());
        assertEquals("The AI did not create a conversation. You were not charged.", error.getMessage());
    }

    @Test
    void quickLengthRejectsSixTurns() {
        ApiException error = assertThrows(
                ApiException.class,
                () -> LanguageStudioDraftParser.parse(dialogue(6), ConversationLength.QUICK));
        assertEquals(HttpStatus.BAD_REQUEST, error.getStatus());
    }

    @Test
    void quickLengthKeepsEightTurns() {
        LanguageStudioDraft draft = LanguageStudioDraftParser.parse(dialogue(8), ConversationLength.QUICK);
        assertEquals(8, draft.turns().size());
    }

    @Test
    void fullLengthRejectsAShortDialogue() {
        ApiException error = assertThrows(
                ApiException.class,
                () -> LanguageStudioDraftParser.parse(
                        """
                        {"title":"Too short for full","yourRole":"you","theirRole":"them","turns":[
                          {"role":"them","speaker":"A","native":"n","target":"t"},
                          {"role":"you","speaker":"B","native":"n","target":"t"},
                          {"role":"them","speaker":"A","native":"n","target":"t"},
                          {"role":"you","speaker":"B","native":"n","target":"t"},
                          {"role":"them","speaker":"A","native":"n","target":"t"},
                          {"role":"you","speaker":"B","native":"n","target":"t"}
                        ]}
                        """,
                        ConversationLength.FULL));
        assertEquals(HttpStatus.BAD_REQUEST, error.getStatus());
    }

    private static String dialogue(int turns) {
        StringBuilder body = new StringBuilder();
        for (int i = 0; i < turns; i++) {
            if (i > 0) {
                body.append(',');
            }
            String role = i % 2 == 0 ? "them" : "you";
            body.append("{\"role\":\"").append(role).append("\",\"speaker\":\"A\",\"native\":\"n\",\"target\":\"t\"}");
        }
        return "{\"title\":\"Cafe\",\"yourRole\":\"you\",\"theirRole\":\"them\",\"turns\":[" + body + "]}";
    }
}
