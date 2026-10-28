package com.flashcards.library;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

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
    private static final String PHRASEBOOKS = "library/phrasebooks.json";
    private static final String PHRASEBOOKS_MORE = "library/phrasebooks-more.json";
    private static final String[] SUBJECT_CATALOGS = {
            "library/geography.json",
            "library/geography-more.json",
            "library/arithmetic.json",
            "library/arithmetic-more.json",
            "library/civics.json",
            "library/human-body.json",
            "library/human-body-more.json",
            "library/sat-math.json",
            "library/sat-math-more.json",
            "library/sat-reading-writing.json",
            "library/sat-reading-writing-more.json",
            "library/biology.json",
            "library/biology-more.json",
            "library/us-history.json",
            "library/us-history-more.json",
            "library/music-theory.json",
            "library/personal-finance.json",
            "library/chemistry.json",
            "library/world-history.json",
            "library/computer-science.json"
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
        loadCatalog(PHRASEBOOKS);
        loadCatalog(PHRASEBOOKS_MORE);
        for (String catalog : SUBJECT_CATALOGS) {
            loadCatalog(catalog);
        }
    }

    private void loadCatalog(String classpath) throws Exception {
        ClassPathResource resource = new ClassPathResource(classpath);
        if (!resource.exists()) {
            log.warn("Library catalog is missing; skipping {}", classpath);
            return;
        }
        try (InputStream stream = resource.getInputStream()) {
            JsonNode root = objectMapper.readTree(stream);
            JsonNode groups = root.path("groups");
            int addedGroups = 0;
            int addedDecks = 0;
            int addedCards = 0;
            int replacedDecks = 0;
            for (JsonNode groupNode : groups) {
                if (groupNode.path("decks").isEmpty()) {
                    continue;
                }
                SeedResult result = seedGroup(groupNode);
                addedGroups += result.groups();
                addedDecks += result.decks();
                addedCards += result.cards();
                replacedDecks += result.replacedDecks();
            }
            if (addedGroups > 0 || addedDecks > 0 || replacedDecks > 0) {
                log.info(
                        "Seeded library catalog {}: {} groups, {} decks, {} cards, {} decks refreshed",
                        classpath,
                        addedGroups,
                        addedDecks,
                        addedCards,
                        replacedDecks);
            }
        }
    }

    SeedResult seedGroup(JsonNode groupNode) {
        String slug = groupNode.path("slug").asText();
        LibraryGroup group = groupRepository.findBySlug(slug).orElse(null);
        int groupsCreated = 0;
        if (group == null) {
            group = new LibraryGroup();
            group.setSlug(slug);
            group.setName(groupNode.path("name").asText());
            group.setColor(COLORS[(int) (groupRepository.count() % COLORS.length)]);
            group.setSourceLanguage(groupNode.path("sourceLanguage").asText("en-US"));
            group.setTargetLanguage(groupNode.path("targetLanguage").asText("en-US"));
            group.setSourceUrl(groupNode.path("sourceUrl").asText(""));
            group.setSourceTitle(groupNode.path("sourceTitle").asText(""));
            group.setAttribution(groupNode.path("attribution").asText(""));
            groupRepository.save(group);
            groupsCreated = 1;
        }
        int nextPosition = deckRepository.findByGroupIdOrderByPositionAscIdAsc(group.getId()).stream()
                .mapToInt(LibraryDeck::getPosition)
                .max()
                .orElse(-1)
                + 1;
        int decksCreated = 0;
        int cardsCreated = 0;
        int replacedDecks = 0;
        int jsonPosition = 0;
        for (JsonNode deckNode : groupNode.path("decks")) {
            String deckSlug = deckNode.path("slug").asText();
            LibraryDeck deck = deckRepository.findByGroup_IdAndSlug(group.getId(), deckSlug).orElse(null);
            if (deck != null) {
                if (replaceCardsIfChanged(deck, deckNode)) {
                    replacedDecks += 1;
                }
                jsonPosition += 1;
                continue;
            }
            deck = new LibraryDeck();
            deck.setGroup(group);
            deck.setSlug(deckSlug);
            deck.setName(deckNode.path("name").asText());
            String description = deckNode.path("description").asText(null);
            deck.setDescription(description == null || description.isBlank() ? null : description);
            deck.setPosition(groupsCreated == 1 ? deckNode.path("position").asInt(jsonPosition) : nextPosition++);
            deckRepository.save(deck);
            List<LibraryCard> cards = cardsFrom(deck, deckNode);
            cardRepository.saveAll(cards);
            decksCreated += 1;
            cardsCreated += cards.size();
            jsonPosition += 1;
        }
        return new SeedResult(groupsCreated, decksCreated, cardsCreated, replacedDecks);
    }

    private boolean replaceCardsIfChanged(LibraryDeck deck, JsonNode deckNode) {
        if (!deckNode.path("cards").isArray() || deckNode.path("cards").isEmpty()) {
            return false;
        }
        List<LibraryCard> desired = cardsFrom(deck, deckNode);
        List<LibraryCard> existing = cardRepository.findByDeckIdOrderByPositionAscIdAsc(deck.getId());
        if (sameCards(existing, desired)) {
            return false;
        }
        cardRepository.deleteAll(existing);
        cardRepository.flush();
        cardRepository.saveAll(desired);
        return true;
    }

    private static List<LibraryCard> cardsFrom(LibraryDeck deck, JsonNode deckNode) {
        List<LibraryCard> cards = new ArrayList<>();
        int position = 0;
        for (JsonNode cardNode : deckNode.path("cards")) {
            LibraryCard card = new LibraryCard();
            card.setDeck(deck);
            card.setFront(cardNode.path("front").asText());
            card.setBack(cardNode.path("back").asText());
            card.setHint(hintText(cardNode.path("hint")));
            card.setPosition(position++);
            cards.add(card);
        }
        return cards;
    }

    private static boolean sameCards(List<LibraryCard> existing, List<LibraryCard> desired) {
        if (existing.size() != desired.size()) {
            return false;
        }
        for (int i = 0; i < existing.size(); i++) {
            LibraryCard left = existing.get(i);
            LibraryCard right = desired.get(i);
            if (left.getPosition() != right.getPosition()
                    || !left.getFront().equals(right.getFront())
                    || !left.getBack().equals(right.getBack())
                    || !Objects.equals(normalize(left.getHint()), normalize(right.getHint()))) {
                return false;
            }
        }
        return true;
    }

    private static String hintText(JsonNode hint) {
        if (hint.isMissingNode() || hint.isNull()) {
            return null;
        }
        return normalize(hint.asText());
    }

    private static String normalize(String value) {
        return value == null || value.isBlank() ? null : value;
    }

    record SeedResult(int groups, int decks, int cards, int replacedDecks) {
    }
}
