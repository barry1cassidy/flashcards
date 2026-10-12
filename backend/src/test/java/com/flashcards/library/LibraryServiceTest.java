package com.flashcards.library;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.flashcards.card.CardRepository;
import com.flashcards.deck.DeckRepository;
import com.flashcards.deck.DeckService;
import com.flashcards.group.DeckGroupRepository;
import com.flashcards.user.UserRepository;

@ExtendWith(MockitoExtension.class)
class LibraryServiceTest {

    @Mock
    private LibraryGroupRepository groupRepository;

    @Mock
    private LibraryDeckRepository deckRepository;

    @Mock
    private LibraryCardRepository cardRepository;

    @Mock
    private DeckRepository userDeckRepository;

    @Mock
    private DeckGroupRepository userGroupRepository;

    @Mock
    private CardRepository userCardRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private DeckService deckService;

    private LibraryService service;

    @BeforeEach
    void setUp() {
        service = new LibraryService(
                groupRepository,
                deckRepository,
                cardRepository,
                userDeckRepository,
                userGroupRepository,
                userCardRepository,
                userRepository,
                deckService);
    }

    @Test
    void anonymousReadReturnsCardsWithoutLookingUpACopy() {
        UUID deckId = UUID.randomUUID();
        LibraryGroup group = new LibraryGroup();
        group.setId(UUID.randomUUID());
        group.setSlug("spanish");
        group.setName("Spanish");
        group.setColor("#2563EB");
        group.setSourceLanguage("en-US");
        group.setTargetLanguage("es-ES");
        LibraryDeck deck = new LibraryDeck();
        deck.setId(deckId);
        deck.setSlug("greetings");
        deck.setName("Greetings");
        deck.setDescription("Everyday hellos");
        deck.setPosition(0);
        deck.setGroup(group);
        LibraryCard card = new LibraryCard();
        card.setId(UUID.randomUUID());
        card.setFront("Hello");
        card.setBack("Hola");
        card.setPosition(0);
        when(deckRepository.findWithGroupById(deckId)).thenReturn(Optional.of(deck));
        when(cardRepository.findByDeckIdOrderByPositionAscIdAsc(deckId)).thenReturn(List.of(card));

        LibraryDeckResponse response = service.getDeck(null, deckId);

        assertEquals("Greetings", response.name());
        assertNull(response.copiedDeckId());
        assertEquals("Hello", response.cards().get(0).front());
        verifyNoInteractions(userDeckRepository);
    }
}
