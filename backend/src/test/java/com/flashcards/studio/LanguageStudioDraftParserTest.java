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
}
