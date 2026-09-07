package com.flashcards.study;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.flashcards.card.Card;
import com.flashcards.card.CardRepository;
import com.flashcards.card.CardService;
import com.flashcards.common.ApiException;
import com.flashcards.deck.DeckService;
import com.flashcards.review.CardReview;
import com.flashcards.review.CardReviewRepository;
import com.flashcards.review.ReviewRating;
import com.flashcards.review.Sm2Scheduler;
import com.flashcards.user.RestudyWait;
import com.flashcards.user.StudyOrder;
import com.flashcards.user.StudyScope;
import com.flashcards.user.User;
import com.flashcards.user.UserRepository;

@Service
public class StudyService {

    public static final int SESSION_SIZE = 20;
    private static final Set<String> MODES = Set.of("FLIP", "QUIZ", "WRITE", "MATCH", "AUDIO");

    private final DeckService deckService;
    private final CardService cardService;
    private final CardRepository cardRepository;
    private final CardReviewRepository cardReviewRepository;
    private final UserRepository userRepository;
    private final Sm2Scheduler sm2Scheduler;

    public StudyService(
            DeckService deckService,
            CardService cardService,
            CardRepository cardRepository,
            CardReviewRepository cardReviewRepository,
            UserRepository userRepository,
            Sm2Scheduler sm2Scheduler) {
        this.deckService = deckService;
        this.cardService = cardService;
        this.cardRepository = cardRepository;
        this.cardReviewRepository = cardReviewRepository;
        this.userRepository = userRepository;
        this.sm2Scheduler = sm2Scheduler;
    }

    @Transactional(readOnly = true)
    public StudySessionResponse startSession(UUID userId, UUID deckId, String mode) {
        String normalized = normalizeMode(mode);
        deckService.requireOwned(userId, deckId);
        User user = requireUser(userId);
        StudyScope scope = user.getStudyScope() == null ? StudyScope.DUE_ONLY : user.getStudyScope();
        StudyOrder order = user.getStudyOrder() == null ? StudyOrder.POSITION : user.getStudyOrder();
        List<Card> queue;
        if (scope == StudyScope.ALL) {
            queue = new ArrayList<>(cardRepository.findByDeckIdOrderByPositionAscIdAsc(deckId));
        } else {
            queue = new ArrayList<>(
                    cardRepository.findStudyQueue(deckId, LocalDate.now(), PageRequest.of(0, SESSION_SIZE)));
        }
        applyOrder(queue, order);
        List<Card> deckCards = "QUIZ".equals(normalized)
                ? cardRepository.findByDeckIdOrderByPositionAscIdAsc(deckId)
                : List.of();
        List<StudyCardResponse> cards = queue.stream()
                .map(card -> toStudyCard(card, normalized, deckCards))
                .toList();
        LocalDate nextDue = cardReviewRepository.findNextDueAfter(deckId, LocalDate.now()).orElse(null);
        return new StudySessionResponse(normalized, cards, nextDue, scope, order);
    }

    @Transactional
    public ReviewResponse review(UUID userId, UUID cardId, ReviewRating rating) {
        Card card = cardService.requireOwnedCard(userId, cardId);
        User user = requireUser(userId);
        LocalDate today = LocalDate.now();
        CardReview review = cardReviewRepository.findByCardId(cardId)
                .orElseGet(() -> CardReview.newFor(card, today));
        sm2Scheduler.apply(review, rating, today);
        if (user.getRestudyWait() == RestudyWait.IMMEDIATE) {
            review.setDueDate(today);
        }
        cardReviewRepository.save(review);
        card.getDeck().setUpdatedAt(java.time.Instant.now());
        return new ReviewResponse(card.getId(), review.getDueDate(), review.getIntervalDays(), review.getRepetitions());
    }

    @Transactional
    public int resetDueDates(UUID userId) {
        requireUser(userId);
        return cardReviewRepository.resetDueDatesForUser(userId, LocalDate.now());
    }

    private User requireUser(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Not authenticated"));
    }

    private static void applyOrder(List<Card> cards, StudyOrder order) {
        if (order == StudyOrder.REVERSE) {
            cards.sort(Comparator.comparingInt(Card::getPosition).reversed().thenComparing(Card::getId));
        } else if (order == StudyOrder.RANDOM) {
            Collections.shuffle(cards);
        } else {
            cards.sort(Comparator.comparingInt(Card::getPosition).thenComparing(Card::getId));
        }
    }

    private static String normalizeMode(String mode) {
        if (mode == null || mode.isBlank()) {
            return "FLIP";
        }
        String value = mode.trim().toUpperCase(Locale.ROOT);
        if (!MODES.contains(value)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Unknown study mode");
        }
        return value;
    }

    private static StudyCardResponse toStudyCard(Card card, String mode, List<Card> deckCards) {
        if (!"QUIZ".equals(mode)) {
            return StudyCardResponse.of(
                    card.getId(),
                    card.getFront(),
                    card.getBack(),
                    card.getHint(),
                    card.getDeck().getFrontLanguage(),
                    card.getDeck().getBackLanguage());
        }
        List<String> choices = new ArrayList<>();
        choices.add(card.getBack());
        List<String> distractors = deckCards.stream()
                .filter(other -> !other.getId().equals(card.getId()))
                .map(Card::getBack)
                .distinct()
                .collect(Collectors.toCollection(ArrayList::new));
        Collections.shuffle(distractors);
        for (String distractor : distractors) {
            if (choices.size() >= 4) {
                break;
            }
            if (!choices.contains(distractor)) {
                choices.add(distractor);
            }
        }
        Collections.shuffle(choices);
        return StudyCardResponse.quiz(
                card.getId(),
                card.getFront(),
                card.getBack(),
                card.getHint(),
                card.getDeck().getFrontLanguage(),
                card.getDeck().getBackLanguage(),
                choices);
    }
}
