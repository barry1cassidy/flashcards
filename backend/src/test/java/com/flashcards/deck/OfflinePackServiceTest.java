package com.flashcards.deck;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import com.flashcards.card.Card;
import com.flashcards.card.CardRepository;
import com.flashcards.common.ApiException;
import com.flashcards.user.User;
import com.flashcards.user.UserRepository;

@ExtendWith(MockitoExtension.class)
class OfflinePackServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private DeckService deckService;

    @Mock
    private CardRepository cardRepository;

    private OfflinePackService service;

    @BeforeEach
    void setUp() {
        service = new OfflinePackService(userRepository, deckService, cardRepository);
    }

    @Test
    void snapshotRequiresPro() {
        UUID userId = UUID.randomUUID();
        User user = new User();
        user.setProLicensed(false);
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));

        ApiException error = assertThrows(ApiException.class, () -> service.snapshot(userId, UUID.randomUUID()));

        assertEquals(HttpStatus.FORBIDDEN, error.getStatus());
        assertEquals("Pro license required", error.getMessage());
    }

    @Test
    void snapshotKeepsTextAndSkipsBlankCards() {
        UUID userId = UUID.randomUUID();
        UUID deckId = UUID.randomUUID();
        User user = new User();
        user.setProLicensed(true);
        Deck deck = new Deck();
        deck.setId(deckId);
        deck.setName("Spanish");
        deck.setDescription("Basics");
        deck.setFrontLanguage("es-ES");
        deck.setBackLanguage("en-US");
        Card text = card("Hola", "Hello", "greeting", 0);
        Card blank = card("  ", "", null, 1);
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(deckService.requireOwned(userId, deckId)).thenReturn(deck);
        when(cardRepository.findByDeckIdOrderByPositionAscIdAsc(deckId)).thenReturn(List.of(text, blank));

        OfflinePackResponse pack = service.snapshot(userId, deckId);

        assertEquals(deckId, pack.id());
        assertEquals("Spanish", pack.name());
        assertEquals("es-ES", pack.frontLanguage());
        assertEquals(1, pack.cards().size());
        assertEquals("Hola", pack.cards().get(0).front());
        assertEquals("Hello", pack.cards().get(0).back());
        assertEquals("greeting", pack.cards().get(0).hint());
    }

    private static Card card(String front, String back, String hint, int position) {
        Card card = new Card();
        card.setId(UUID.randomUUID());
        card.setFront(front);
        card.setBack(back);
        card.setHint(hint);
        card.setPosition(position);
        return card;
    }
}
