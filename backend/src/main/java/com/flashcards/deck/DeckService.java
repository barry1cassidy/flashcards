package com.flashcards.deck;

import java.util.UUID;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.flashcards.card.Card;
import com.flashcards.card.CardLanguages;
import com.flashcards.card.CardRepository;
import com.flashcards.common.ApiException;
import com.flashcards.group.DeckGroup;
import com.flashcards.review.CardReview;
import com.flashcards.review.CardReviewRepository;
import com.flashcards.review.ReviewRating;
import com.flashcards.security.OwnedAccess;
import com.flashcards.user.User;
import com.flashcards.user.UserRepository;

@Service
public class DeckService {

    private final DeckRepository deckRepository;
    private final CardRepository cardRepository;
    private final CardReviewRepository cardReviewRepository;
    private final UserRepository userRepository;
    private final OwnedAccess ownedAccess;

    public DeckService(
            DeckRepository deckRepository,
            CardRepository cardRepository,
            CardReviewRepository cardReviewRepository,
            UserRepository userRepository,
            OwnedAccess ownedAccess) {
        this.deckRepository = deckRepository;
        this.cardRepository = cardRepository;
        this.cardReviewRepository = cardReviewRepository;
        this.userRepository = userRepository;
        this.ownedAccess = ownedAccess;
    }

    @Transactional(readOnly = true)
    public List<DeckResponse> list(UUID userId) {
        return deckRepository.findByUserIdOrderByUpdatedAtDesc(userId).stream()
                .map(deck -> toResponse(deck, statsFor(deck)))
                .toList();
    }

    @Transactional(readOnly = true)
    public DeckResponse get(UUID userId, UUID deckId) {
        Deck deck = requireOwned(userId, deckId);
        return toResponse(deck, statsFor(deck));
    }

    @Transactional
    public DeckResponse create(UUID userId, DeckRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Not authenticated"));
        Deck deck = new Deck();
        deck.setUser(user);
        deck.setName(request.name().trim());
        deck.setDescription(trimToNull(request.description()));
        deck.setGroup(resolveGroup(userId, request.groupId()));
        String fallback = CardLanguages.fromUserLocale(user.getLocale());
        deck.setFrontLanguage(CardLanguages.normalize(request.frontLanguage(), fallback));
        deck.setBackLanguage(CardLanguages.normalize(request.backLanguage(), fallback));
        deckRepository.save(deck);
        return toResponse(deck, new DeckStats(0, 0, 0, null, 0, 0));
    }

    @Transactional
    public DeckResponse update(UUID userId, UUID deckId, DeckRequest request) {
        Deck deck = requireOwned(userId, deckId);
        deck.setName(request.name().trim());
        deck.setDescription(trimToNull(request.description()));
        deck.setGroup(resolveGroup(userId, request.groupId()));
        String fallback = CardLanguages.fromUserLocale(deck.getUser().getLocale());
        if (request.frontLanguage() != null && !request.frontLanguage().isBlank()) {
            deck.setFrontLanguage(CardLanguages.normalize(request.frontLanguage(), fallback));
        }
        if (request.backLanguage() != null && !request.backLanguage().isBlank()) {
            deck.setBackLanguage(CardLanguages.normalize(request.backLanguage(), fallback));
        }
        return toResponse(deck, statsFor(deck));
    }

    @Transactional
    public void delete(UUID userId, UUID deckId) {
        Deck deck = requireOwned(userId, deckId);
        deckRepository.delete(deck);
    }

    public DeckResponse assignGroup(UUID userId, UUID deckId, UUID groupId) {
        Deck deck = requireOwned(userId, deckId);
        deck.setGroup(resolveGroup(userId, groupId));
        return toResponse(deck, statsFor(deck));
    }

    public List<DeckResponse> listByGroup(UUID userId, UUID groupId) {
        return deckRepository.findByGroupIdAndUserId(groupId, userId).stream()
                .map(deck -> toResponse(deck, statsFor(deck)))
                .toList();
    }

    public Deck requireOwned(UUID userId, UUID deckId) {
        return ownedAccess.requireDeck(userId, deckId);
    }

    public List<Deck> requireOwned(UUID userId, List<UUID> deckIds) {
        return ownedAccess.requireDecks(userId, deckIds);
    }

    public DeckStats statsFor(Deck deck) {
        List<Card> cards = cardRepository.findByDeckIdOrderByPositionAscIdAsc(deck.getId());
        if (cards.isEmpty()) {
            return new DeckStats(0, 0, 0, null, 0, 0);
        }
        Map<UUID, CardReview> reviews = cardReviewRepository
                .findByCardIdIn(cards.stream().map(Card::getId).toList())
                .stream()
                .collect(Collectors.toMap(CardReview::getCardId, review -> review));
        LocalDate today = LocalDate.now();
        long due = 0;
        long learned = 0;
        long hard = 0;
        long again = 0;
        Instant lastStudied = null;
        for (Card card : cards) {
            CardReview review = reviews.get(card.getId());
            if (review == null || !review.getDueDate().isAfter(today)) {
                due++;
            }
            if (review != null && review.getRepetitions() >= 1) {
                learned++;
            }
            if (review != null && review.getLastRating() == ReviewRating.HARD) {
                hard++;
            }
            if (review != null && review.getLastRating() == ReviewRating.AGAIN) {
                again++;
            }
            if (review != null && review.getLastReviewedAt() != null
                    && (lastStudied == null || review.getLastReviewedAt().isAfter(lastStudied))) {
                lastStudied = review.getLastReviewedAt();
            }
        }
        return new DeckStats(cards.size(), due, learned, lastStudied, hard, again);
    }

    public DeckResponse toResponse(Deck deck, DeckStats stats) {
        return new DeckResponse(
                deck.getId(),
                deck.getName(),
                deck.getDescription(),
                toGroupSummary(deck.getGroup()),
                deck.getFrontLanguage(),
                deck.getBackLanguage(),
                deck.getCreatedAt(),
                deck.getUpdatedAt(),
                stats.cardCount(),
                stats.dueCount(),
                stats.learnedCount(),
                stats.lastStudiedAt(),
                stats.hardCount(),
                stats.againCount());
    }

    private DeckGroup resolveGroup(UUID userId, UUID groupId) {
        if (groupId == null) {
            return null;
        }
        return ownedAccess.requireSet(userId, groupId);
    }

    private static GroupSummary toGroupSummary(DeckGroup group) {
        if (group == null) {
            return null;
        }
        return new GroupSummary(group.getId(), group.getName(), group.getColor());
    }

    private static String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    public record DeckStats(
            long cardCount, long dueCount, long learnedCount, Instant lastStudiedAt, long hardCount, long againCount) {
    }
}
