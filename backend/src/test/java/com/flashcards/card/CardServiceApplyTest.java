package com.flashcards.card;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.flashcards.common.ApiException;
import com.flashcards.deck.Deck;
import com.flashcards.deck.DeckService;
import com.flashcards.security.OwnedAccess;

@ExtendWith(MockitoExtension.class)
class CardServiceApplyTest {

    @Mock
    private CardRepository cardRepository;
    @Mock
    private DeckService deckService;
    @Mock
    private OwnedAccess ownedAccess;
    @Mock
    private CardImageService cardImageService;

    private CardService cardService;
    private UUID userId;
    private UUID deckId;

    @BeforeEach
    void setUp() {
        cardService = new CardService(cardRepository, deckService, ownedAccess, cardImageService);
        userId = UUID.randomUUID();
        deckId = UUID.randomUUID();
    }

    @Test
    void applyEditsUpdatesTheChosenCards() {
        UUID cardId = UUID.randomUUID();
        Deck deck = new Deck();
        Card card = card(cardId, deck, "1. Hola", "Hello");
        when(deckService.requireOwned(userId, deckId)).thenReturn(deck);
        when(cardRepository.findByDeckIdOrderByPositionAscIdAsc(deckId)).thenReturn(List.of(card));

        int updated = cardService.applyEdits(
                userId,
                deckId,
                List.of(new ApplyCardEditsRequest.CardEdit(cardId, " Hola ", "Hello", "  ")));

        assertEquals(1, updated);
        assertEquals("Hola", card.getFront());
        assertEquals("Hello", card.getBack());
        assertEquals(null, card.getHint());
    }

    @Test
    void applyEditsRejectsACardThatIsNotInTheDeck() {
        Deck deck = new Deck();
        when(deckService.requireOwned(userId, deckId)).thenReturn(deck);
        when(cardRepository.findByDeckIdOrderByPositionAscIdAsc(deckId)).thenReturn(List.of());

        assertThrows(
                ApiException.class,
                () -> cardService.applyEdits(
                        userId,
                        deckId,
                        List.of(new ApplyCardEditsRequest.CardEdit(UUID.randomUUID(), "Hola", "Hello", null))));
    }

    private static Card card(UUID id, Deck deck, String front, String back) {
        Card card = new Card();
        card.setId(id);
        card.setDeck(deck);
        card.setFront(front);
        card.setBack(back);
        return card;
    }
}
