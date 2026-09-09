package com.flashcards.agent;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.flashcards.card.CardDraft;
import com.flashcards.card.CardService;
import com.flashcards.deck.DeckRequest;
import com.flashcards.deck.DeckResponse;
import com.flashcards.deck.DeckService;
import com.flashcards.deck.GroupSummary;
import com.flashcards.group.GroupService;

@ExtendWith(MockitoExtension.class)
class AgentToolsTest {

    @Mock
    private GroupService groupService;
    @Mock
    private DeckService deckService;
    @Mock
    private CardService cardService;

    private UUID userId;
    private AgentTools tools;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        tools = new AgentTools(userId, null, 40, groupService, deckService, cardService);
    }

    @Test
    void createDeckOnlyOnce() {
        UUID deckId = UUID.randomUUID();
        when(deckService.create(eq(userId), any(DeckRequest.class))).thenReturn(deckResponse(deckId, "Travel"));

        String first = tools.createDeck("Travel", "Phrases", "es-ES", "en-US", null);
        String second = tools.createDeck("Travel 2", "More", "es-ES", "en-US", null);

        assertTrue(first.contains(deckId.toString()));
        assertTrue(second.contains("already created"));
        verify(deckService).create(eq(userId), any(DeckRequest.class));
    }

    @Test
    void addCardsCapsAtMax() {
        UUID deckId = UUID.randomUUID();
        when(deckService.create(eq(userId), any(DeckRequest.class))).thenReturn(deckResponse(deckId, "Travel"));
        when(cardService.createMany(eq(userId), eq(deckId), any())).thenAnswer(invocation -> {
            List<CardDraft> drafts = invocation.getArgument(2);
            return drafts.size();
        });
        tools = new AgentTools(userId, null, 2, groupService, deckService, cardService);
        tools.createDeck("Travel", null, "es-ES", "en-US", null);

        String added = tools.addCards(
                deckId.toString(),
                List.of(
                        new AgentTools.AgentCardInput("hola", "hello", null),
                        new AgentTools.AgentCardInput("adios", "goodbye", null),
                        new AgentTools.AgentCardInput("gracias", "thanks", null)));

        assertTrue(added.contains("\"added\":2"));
        verify(cardService).createMany(eq(userId), eq(deckId), any());
        String extra = tools.addCards(deckId.toString(), List.of(new AgentTools.AgentCardInput("si", "yes", null)));
        assertTrue(extra.contains("Card limit"));
        verify(cardService).createMany(eq(userId), eq(deckId), any());
    }

    @Test
    void skipsCreateSetWhenNotCalled() {
        verify(groupService, never()).create(any(), any());
    }

    private static DeckResponse deckResponse(UUID id, String name) {
        Instant now = Instant.parse("2026-09-09T00:00:00Z");
        return new DeckResponse(
                id,
                name,
                null,
                new GroupSummary(UUID.randomUUID(), "Spanish", "#4C6FFF"),
                "es-ES",
                "en-US",
                now,
                now,
                0,
                0,
                0,
                null,
                0,
                0);
    }
}
