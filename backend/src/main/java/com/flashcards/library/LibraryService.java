package com.flashcards.library;

import java.util.UUID;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.flashcards.card.Card;
import com.flashcards.card.CardLanguages;
import com.flashcards.card.CardRepository;
import com.flashcards.card.CardResponse;
import com.flashcards.common.ApiException;
import com.flashcards.deck.Deck;
import com.flashcards.deck.DeckRepository;
import com.flashcards.deck.DeckResponse;
import com.flashcards.deck.DeckService;
import com.flashcards.group.DeckGroup;
import com.flashcards.group.DeckGroupRepository;
import com.flashcards.user.User;
import com.flashcards.user.UserRepository;

@Service
public class LibraryService {

    private final LibraryGroupRepository groupRepository;
    private final LibraryDeckRepository deckRepository;
    private final LibraryCardRepository cardRepository;
    private final DeckRepository userDeckRepository;
    private final DeckGroupRepository userGroupRepository;
    private final CardRepository userCardRepository;
    private final UserRepository userRepository;
    private final DeckService deckService;

    public LibraryService(
            LibraryGroupRepository groupRepository,
            LibraryDeckRepository deckRepository,
            LibraryCardRepository cardRepository,
            DeckRepository userDeckRepository,
            DeckGroupRepository userGroupRepository,
            CardRepository userCardRepository,
            UserRepository userRepository,
            DeckService deckService) {
        this.groupRepository = groupRepository;
        this.deckRepository = deckRepository;
        this.cardRepository = cardRepository;
        this.userDeckRepository = userDeckRepository;
        this.userGroupRepository = userGroupRepository;
        this.userCardRepository = userCardRepository;
        this.userRepository = userRepository;
        this.deckService = deckService;
    }

    @Transactional(readOnly = true)
    public List<LibraryGroupResponse> list(UUID userId, String query) {
        List<LibraryGroup> groups = groupRepository.findAllByOrderByNameAsc();
        if (groups.isEmpty()) {
            return List.of();
        }
        List<LibraryDeck> decks = deckRepository.findByGroupIdIn(groups.stream().map(LibraryGroup::getId).toList());
        Map<UUID, Long> cardCounts = cardCounts(decks.stream().map(LibraryDeck::getId).toList());
        Map<UUID, List<LibraryDeck>> decksByGroup = decks.stream().collect(Collectors.groupingBy(deck -> deck.getGroup().getId()));
        Map<UUID, UUID> copies = copiesFor(userId, decks.stream().map(LibraryDeck::getId).toList());
        String needle = normalizeQuery(query);
        List<LibraryGroupResponse> result = new ArrayList<>();
        for (LibraryGroup group : groups) {
            List<LibraryDeck> groupDecks = decksByGroup.getOrDefault(group.getId(), List.of());
            List<LibraryDeckSummary> summaries = groupDecks.stream()
                    .map(deck -> toSummary(deck, cardCounts.getOrDefault(deck.getId(), 0L), copies.get(deck.getId())))
                    .filter(summary -> matches(needle, group, summary))
                    .toList();
            if (needle != null && summaries.isEmpty() && !haystack(group.getName(), group.getSlug()).contains(needle)) {
                continue;
            }
            if (needle != null && summaries.isEmpty()) {
                summaries = groupDecks.stream()
                        .map(deck -> toSummary(deck, cardCounts.getOrDefault(deck.getId(), 0L), copies.get(deck.getId())))
                        .toList();
            }
            long cardCount = summaries.stream().mapToLong(LibraryDeckSummary::cardCount).sum();
            result.add(toGroupResponse(group, summaries, cardCount));
        }
        return result;
    }

    @Transactional(readOnly = true)
    public LibraryGroupResponse getGroup(UUID userId, UUID groupId) {
        LibraryGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Library group not found"));
        List<LibraryDeck> decks = deckRepository.findByGroupIdOrderByPositionAscIdAsc(groupId);
        Map<UUID, Long> cardCounts = cardCounts(decks.stream().map(LibraryDeck::getId).toList());
        Map<UUID, UUID> copies = copiesFor(userId, decks.stream().map(LibraryDeck::getId).toList());
        List<LibraryDeckSummary> summaries = decks.stream()
                .map(deck -> toSummary(deck, cardCounts.getOrDefault(deck.getId(), 0L), copies.get(deck.getId())))
                .toList();
        long cardCount = summaries.stream().mapToLong(LibraryDeckSummary::cardCount).sum();
        return toGroupResponse(group, summaries, cardCount);
    }

    @Transactional(readOnly = true)
    public LibraryDeckResponse getDeck(UUID userId, UUID deckId) {
        LibraryDeck deck = deckRepository.findWithGroupById(deckId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Library deck not found"));
        List<CardResponse> cards = cardRepository.findByDeckIdOrderByPositionAscIdAsc(deckId).stream()
                .map(card -> new CardResponse(card.getId(), card.getFront(), card.getBack(), card.getHint(), card.getPosition()))
                .toList();
        UUID copiedId = userDeckRepository.findByUser_IdAndLibraryDeckId(userId, deckId).map(Deck::getId).orElse(null);
        LibraryGroup group = deck.getGroup();
        return new LibraryDeckResponse(
                deck.getId(),
                deck.getSlug(),
                deck.getName(),
                deck.getDescription(),
                deck.getPosition(),
                group.getSourceLanguage(),
                group.getTargetLanguage(),
                new LibraryGroupRef(group.getId(), group.getSlug(), group.getName(), group.getColor()),
                copiedId,
                cards);
    }

    @Transactional
    public DeckResponse addToMyDecks(UUID userId, UUID libraryDeckId) {
        LibraryDeck libraryDeck = deckRepository.findWithGroupById(libraryDeckId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Library deck not found"));
        return userDeckRepository.findByUser_IdAndLibraryDeckId(userId, libraryDeckId)
                .map(existing -> deckService.get(userId, existing.getId()))
                .orElseGet(() -> copyDeck(userId, libraryDeck));
    }

    private DeckResponse copyDeck(UUID userId, LibraryDeck libraryDeck) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Not authenticated"));
        LibraryGroup libraryGroup = libraryDeck.getGroup();
        DeckGroup group = userGroupRepository.findByUser_IdAndNameIgnoreCase(userId, libraryGroup.getName())
                .orElseGet(() -> {
                    DeckGroup created = new DeckGroup();
                    created.setUser(user);
                    created.setName(libraryGroup.getName());
                    created.setColor(libraryGroup.getColor());
                    return userGroupRepository.save(created);
                });
        Deck deck = new Deck();
        deck.setUser(user);
        deck.setName(libraryDeck.getName());
        deck.setDescription(libraryDeck.getDescription());
        deck.setGroup(group);
        deck.setFrontLanguage(CardLanguages.normalize(libraryGroup.getSourceLanguage(), CardLanguages.DEFAULT));
        deck.setBackLanguage(CardLanguages.normalize(libraryGroup.getTargetLanguage(), CardLanguages.DEFAULT));
        deck.setLibraryDeckId(libraryDeck.getId());
        userDeckRepository.save(deck);
        List<LibraryCard> sourceCards = cardRepository.findByDeckIdOrderByPositionAscIdAsc(libraryDeck.getId());
        List<Card> cards = new ArrayList<>();
        int position = 0;
        for (LibraryCard source : sourceCards) {
            Card card = new Card();
            card.setDeck(deck);
            card.setFront(source.getFront());
            card.setBack(source.getBack());
            card.setHint(source.getHint());
            card.setPosition(position++);
            cards.add(card);
        }
        userCardRepository.saveAll(cards);
        return deckService.toResponse(deck, deckService.statsFor(deck));
    }

    private Map<UUID, UUID> copiesFor(UUID userId, List<UUID> libraryDeckIds) {
        if (userId == null || libraryDeckIds.isEmpty()) {
            return Map.of();
        }
        return userDeckRepository.findByUser_IdAndLibraryDeckIdIn(userId, libraryDeckIds).stream()
                .filter(deck -> deck.getLibraryDeckId() != null)
                .collect(Collectors.toMap(Deck::getLibraryDeckId, Deck::getId, (left, right) -> left));
    }

    private LibraryDeckSummary toSummary(LibraryDeck deck, long cardCount, UUID copiedDeckId) {
        return new LibraryDeckSummary(
                deck.getId(),
                deck.getSlug(),
                deck.getName(),
                deck.getDescription(),
                deck.getPosition(),
                cardCount,
                copiedDeckId);
    }

    private Map<UUID, Long> cardCounts(List<UUID> deckIds) {
        if (deckIds.isEmpty()) {
            return Map.of();
        }
        return cardRepository.countByDeckIds(deckIds).stream()
                .collect(Collectors.toMap(
                        row -> (UUID) row[0],
                        row -> (Long) row[1]));
    }

    private static LibraryGroupResponse toGroupResponse(
            LibraryGroup group, List<LibraryDeckSummary> decks, long cardCount) {
        return new LibraryGroupResponse(
                group.getId(),
                group.getSlug(),
                group.getName(),
                group.getColor(),
                group.getSourceLanguage(),
                group.getTargetLanguage(),
                group.getSourceUrl(),
                group.getSourceTitle(),
                group.getAttribution(),
                decks.size(),
                cardCount,
                decks);
    }

    private static boolean matches(String needle, LibraryGroup group, LibraryDeckSummary deck) {
        if (needle == null) {
            return true;
        }
        return haystack(group.getName(), group.getSlug(), deck.name(), deck.slug(), deck.description()).contains(needle);
    }

    private static String normalizeQuery(String query) {
        if (query == null || query.isBlank()) {
            return null;
        }
        return query.trim().toLowerCase(Locale.ROOT);
    }

    private static String haystack(String... parts) {
        StringBuilder builder = new StringBuilder();
        for (String part : parts) {
            if (part != null && !part.isBlank()) {
                builder.append(' ').append(part.toLowerCase(Locale.ROOT));
            }
        }
        return builder.toString();
    }
}
