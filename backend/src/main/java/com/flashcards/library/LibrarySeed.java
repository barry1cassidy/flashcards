package com.flashcards.library;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

@Component
public class LibrarySeed implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(LibrarySeed.class);
    private static final String[] COLORS = {
            "#2563EB", "#DC2626", "#CA8A04", "#16A34A", "#0891B2",
            "#DB2777", "#7C3AED", "#EA580C", "#0F766E", "#4F46E5",
            "#C2410C", "#BE123C", "#0369A1", "#15803D", "#A16207",
            "#1D4ED8", "#B45309", "#047857", "#6D28D9", "#334155"
    };

    private final LibraryGroupRepository groupRepository;
    private final LibraryDeckRepository deckRepository;
    private final LibraryCardRepository cardRepository;
    private final ObjectMapper objectMapper;

    public LibrarySeed(
            LibraryGroupRepository groupRepository,
            LibraryDeckRepository deckRepository,
            LibraryCardRepository cardRepository,
            ObjectMapper objectMapper) {
        this.groupRepository = groupRepository;
        this.deckRepository = deckRepository;
        this.cardRepository = cardRepository;
        this.objectMapper = objectMapper;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) throws Exception {
        if (groupRepository.count() > 0) {
            return;
        }
        ClassPathResource resource = new ClassPathResource("library/phrasebooks.json");
        if (!resource.exists()) {
            log.warn("Library catalog is missing; skipping seed");
            return;
        }
        try (InputStream stream = resource.getInputStream()) {
            JsonNode root = objectMapper.readTree(stream);
            JsonNode groups = root.path("groups");
            int index = 0;
            int deckCount = 0;
            int cardCount = 0;
            for (JsonNode groupNode : groups) {
                if (groupNode.path("decks").isEmpty()) {
                    continue;
                }
                LibraryGroup group = new LibraryGroup();
                group.setSlug(groupNode.path("slug").asText());
                group.setName(groupNode.path("name").asText());
                group.setColor(COLORS[index % COLORS.length]);
                group.setSourceLanguage(groupNode.path("sourceLanguage").asText("en-US"));
                group.setTargetLanguage(groupNode.path("targetLanguage").asText("en-US"));
                group.setSourceUrl(groupNode.path("sourceUrl").asText());
                group.setSourceTitle(groupNode.path("sourceTitle").asText());
                group.setAttribution(groupNode.path("attribution").asText());
                groupRepository.save(group);
                int position = 0;
                for (JsonNode deckNode : groupNode.path("decks")) {
                    LibraryDeck deck = new LibraryDeck();
                    deck.setGroup(group);
                    deck.setSlug(deckNode.path("slug").asText());
                    deck.setName(deckNode.path("name").asText());
                    String description = deckNode.path("description").asText(null);
                    deck.setDescription(description == null || description.isBlank() ? null : description);
                    deck.setPosition(deckNode.path("position").asInt(position));
                    deckRepository.save(deck);
                    int cardPosition = 0;
                    List<LibraryCard> cards = new ArrayList<>();
                    for (JsonNode cardNode : deckNode.path("cards")) {
                        LibraryCard card = new LibraryCard();
                        card.setDeck(deck);
                        card.setFront(cardNode.path("front").asText());
                        card.setBack(cardNode.path("back").asText());
                        String hint = cardNode.path("hint").asText(null);
                        card.setHint(hint == null || hint.isBlank() ? null : hint);
                        card.setPosition(cardPosition++);
                        cards.add(card);
                    }
                    cardRepository.saveAll(cards);
                    deckCount += 1;
                    cardCount += cards.size();
                    position += 1;
                }
                index += 1;
            }
            log.info("Seeded language library: {} groups, {} decks, {} cards", index, deckCount, cardCount);
        }
    }
}
