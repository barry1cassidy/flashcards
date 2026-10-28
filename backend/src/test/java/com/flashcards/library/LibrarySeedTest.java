package com.flashcards.library;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.boot.DefaultApplicationArguments;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

@ExtendWith(MockitoExtension.class)
class LibrarySeedTest {

    @Mock
    private LibraryGroupRepository groupRepository;

    @Mock
    private LibraryDeckRepository deckRepository;

    @Mock
    private LibraryCardRepository cardRepository;

    private LibrarySeed seed;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        seed = new LibrarySeed(groupRepository, deckRepository, cardRepository, objectMapper);
    }

    @Test
    void refreshesAnExistingSampleDeckWhenCardTextChanges() throws Exception {
        UUID groupId = UUID.randomUUID();
        UUID deckId = UUID.randomUUID();
        LibraryGroup group = group("arabic", groupId);
        LibraryDeck deck = deck(group, deckId, "greetings-courtesy");
        LibraryCard stale = card(deck, "Hello", ",", null);

        when(groupRepository.findBySlug("arabic")).thenReturn(Optional.of(group));
        when(deckRepository.findByGroup_IdAndSlug(groupId, "greetings-courtesy")).thenReturn(Optional.of(deck));
        when(cardRepository.findByDeckIdOrderByPositionAscIdAsc(deckId)).thenReturn(List.of(stale));

        seed.seedGroup(objectMapper.readTree("""
                {
                  "slug": "arabic",
                  "name": "Arabic",
                  "decks": [
                    {
                      "slug": "greetings-courtesy",
                      "name": "Greetings & courtesy",
                      "description": "Hello, names, please, and thanks.",
                      "position": 0,
                      "cards": [
                        {"front": "Hello", "back": "سَلاَم, مَرْحَبًا", "hint": "salām; marḥaban"}
                      ]
                    }
                  ]
                }
                """));

        verify(cardRepository).deleteAll(List.of(stale));
        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<LibraryCard>> saved = ArgumentCaptor.forClass(List.class);
        verify(cardRepository).saveAll(saved.capture());
        assertEquals("سَلاَم, مَرْحَبًا", saved.getValue().get(0).getBack());
        assertEquals("salām; marḥaban", saved.getValue().get(0).getHint());
        assertEquals(0, saved.getValue().get(0).getPosition());
    }

    @Test
    void reloadsTheMainPhrasebookCatalogWhenSpanishIsAlreadySeeded() throws Exception {
        LibraryGroup spanish = group("spanish", UUID.randomUUID());
        when(groupRepository.findBySlug(anyString())).thenAnswer(invocation -> {
            if ("spanish".equals(invocation.getArgument(0))) {
                return Optional.of(spanish);
            }
            return Optional.empty();
        });

        seed.run(new DefaultApplicationArguments());

        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<LibraryCard>> saved = ArgumentCaptor.forClass(List.class);
        verify(cardRepository, atLeastOnce()).saveAll(saved.capture());
        assertTrue(saved.getAllValues().stream()
                .flatMap(List::stream)
                .anyMatch(card -> "سَلاَم, مَرْحَبًا".equals(card.getBack())));
    }

    @Test
    void leavesAnExistingSampleDeckAloneWhenCardsAlreadyMatch() throws Exception {
        UUID groupId = UUID.randomUUID();
        UUID deckId = UUID.randomUUID();
        LibraryGroup group = group("spanish", groupId);
        LibraryDeck deck = deck(group, deckId, "greetings-courtesy");
        LibraryCard current = card(deck, "Hello/Hi", "Hola", "OH-lah");

        when(groupRepository.findBySlug("spanish")).thenReturn(Optional.of(group));
        when(deckRepository.findByGroup_IdAndSlug(groupId, "greetings-courtesy")).thenReturn(Optional.of(deck));
        when(cardRepository.findByDeckIdOrderByPositionAscIdAsc(deckId)).thenReturn(List.of(current));

        seed.seedGroup(objectMapper.readTree("""
                {
                  "slug": "spanish",
                  "name": "Spanish",
                  "decks": [
                    {
                      "slug": "greetings-courtesy",
                      "name": "Greetings & courtesy",
                      "cards": [
                        {"front": "Hello/Hi", "back": "Hola", "hint": "OH-lah"}
                      ]
                    }
                  ]
                }
                """));

        verify(cardRepository, never()).deleteAll(anyList());
        verify(cardRepository, never()).saveAll(anyList());
    }

    private static LibraryGroup group(String slug, UUID id) {
        LibraryGroup group = new LibraryGroup();
        group.setId(id);
        group.setSlug(slug);
        return group;
    }

    private static LibraryDeck deck(LibraryGroup group, UUID id, String slug) {
        LibraryDeck deck = new LibraryDeck();
        deck.setId(id);
        deck.setGroup(group);
        deck.setSlug(slug);
        return deck;
    }

    private static LibraryCard card(LibraryDeck deck, String front, String back, String hint) {
        LibraryCard card = new LibraryCard();
        card.setDeck(deck);
        card.setFront(front);
        card.setBack(back);
        card.setHint(hint);
        card.setPosition(0);
        return card;
    }
}
