package com.flashcards.deck;

import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InOrder;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.flashcards.card.Card;
import com.flashcards.card.CardImageService;
import com.flashcards.card.CardRepository;
import com.flashcards.review.CardReviewRepository;
import com.flashcards.security.OwnedAccess;
import com.flashcards.user.UserRepository;

@ExtendWith(MockitoExtension.class)
class DeckServiceTest {

    @Mock
    private DeckRepository deckRepository;
    @Mock
    private CardRepository cardRepository;
    @Mock
    private CardReviewRepository cardReviewRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private OwnedAccess ownedAccess;
    @Mock
    private CardImageService cardImageService;

    private DeckService deckService;
    private final UUID userId = UUID.fromString("00000000-0000-0000-0000-000000000001");
    private final UUID deckId = UUID.fromString("00000000-0000-0000-0000-0000000000aa");

    @BeforeEach
    void setUp() {
        deckService = new DeckService(
                deckRepository,
                cardRepository,
                cardReviewRepository,
                userRepository,
                ownedAccess,
                cardImageService);
    }

    @Test
    void deleteRemovesCardsBeforeDeck() {
        Deck deck = new Deck();
        Card card = new Card();
        card.setId(UUID.fromString("00000000-0000-0000-0000-0000000000c1"));
        card.setDeck(deck);
        when(ownedAccess.requireDeck(userId, deckId)).thenReturn(deck);
        when(cardRepository.findByDeckIdOrderByPositionAscIdAsc(deckId)).thenReturn(List.of(card));

        deckService.delete(userId, deckId);

        InOrder order = inOrder(cardImageService, cardRepository, deckRepository);
        order.verify(cardImageService).deleteAll(card);
        order.verify(cardRepository).deleteAll(List.of(card));
        order.verify(deckRepository).delete(deck);
        verify(cardRepository).findByDeckIdOrderByPositionAscIdAsc(deckId);
    }
}
