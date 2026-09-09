package com.flashcards.mix;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.flashcards.billing.ProAccess;
import com.flashcards.card.CardRepository;
import com.flashcards.common.ApiException;
import com.flashcards.deck.Deck;
import com.flashcards.deck.DeckRepository;
import com.flashcards.group.DeckGroupRepository;
import com.flashcards.review.CardReviewRepository;
import com.flashcards.review.ReviewRating;
import com.flashcards.study.StudyService;
import com.flashcards.study.StudySessionResponse;
import com.flashcards.user.User;
import com.flashcards.user.UserRepository;

@Service
public class StudyMixService {

    private final StudyMixRepository mixRepository;
    private final UserRepository userRepository;
    private final DeckRepository deckRepository;
    private final DeckGroupRepository groupRepository;
    private final CardRepository cardRepository;
    private final CardReviewRepository cardReviewRepository;
    private final StudyService studyService;

    public StudyMixService(
            StudyMixRepository mixRepository,
            UserRepository userRepository,
            DeckRepository deckRepository,
            DeckGroupRepository groupRepository,
            CardRepository cardRepository,
            CardReviewRepository cardReviewRepository,
            StudyService studyService) {
        this.mixRepository = mixRepository;
        this.userRepository = userRepository;
        this.deckRepository = deckRepository;
        this.groupRepository = groupRepository;
        this.cardRepository = cardRepository;
        this.cardReviewRepository = cardReviewRepository;
        this.studyService = studyService;
    }

    @Transactional(readOnly = true)
    public List<StudyMixResponse> list(UUID userId) {
        User user = requireProUser(userId);
        return mixRepository.findByUserIdOrderByUpdatedAtDesc(user.getId()).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public StudyMixResponse get(UUID userId, UUID mixId) {
        return toResponse(requireOwned(requireProUser(userId).getId(), mixId));
    }

    @Transactional
    public StudyMixResponse create(UUID userId, StudyMixRequest request) {
        User user = requireProUser(userId);
        StudyMix mix = new StudyMix();
        mix.setUser(user);
        apply(mix, user.getId(), request);
        mixRepository.save(mix);
        return toResponse(mix);
    }

    @Transactional
    public StudyMixResponse update(UUID userId, UUID mixId, StudyMixRequest request) {
        User user = requireProUser(userId);
        StudyMix mix = requireOwned(user.getId(), mixId);
        apply(mix, user.getId(), request);
        return toResponse(mix);
    }

    @Transactional
    public void delete(UUID userId, UUID mixId) {
        User user = requireProUser(userId);
        mixRepository.delete(requireOwned(user.getId(), mixId));
    }

    @Transactional(readOnly = true)
    public StudySessionResponse startSession(UUID userId, UUID mixId, String mode, String filter) {
        User user = requireProUser(userId);
        List<UUID> deckIds = resolveDeckIds(requireOwned(user.getId(), mixId));
        return studyService.startSession(user.getId(), deckIds, mode, filter);
    }

    @Transactional
    public int continueNextBatch(UUID userId, UUID mixId) {
        User user = requireProUser(userId);
        List<UUID> deckIds = resolveDeckIds(requireOwned(user.getId(), mixId));
        return studyService.continueNextBatch(user.getId(), deckIds);
    }

    @Transactional
    public int resetDueDates(UUID userId, UUID mixId) {
        User user = requireProUser(userId);
        List<UUID> deckIds = resolveDeckIds(requireOwned(user.getId(), mixId));
        return studyService.resetDueDates(user.getId(), deckIds);
    }

    List<UUID> resolveDeckIds(StudyMix mix) {
        UUID userId = mix.getUser().getId();
        if (mix.isIncludeAll()) {
            return deckRepository.findByUserIdOrderByUpdatedAtDesc(userId).stream()
                    .map(Deck::getId)
                    .toList();
        }
        Set<UUID> ids = new LinkedHashSet<>();
        if (!mix.getSetIds().isEmpty()) {
            deckRepository.findByUser_IdAndGroup_IdIn(userId, mix.getSetIds()).forEach(deck -> ids.add(deck.getId()));
        }
        if (!mix.getDeckIds().isEmpty()) {
            deckRepository.findByIdInAndUser_Id(mix.getDeckIds(), userId).forEach(deck -> ids.add(deck.getId()));
        }
        return List.copyOf(ids);
    }

    private void apply(StudyMix mix, UUID userId, StudyMixRequest request) {
        String name = request.name() == null ? "" : request.name().trim();
        if (name.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Validation failed");
        }
        boolean includeAll = request.includeAll();
        Set<UUID> setIds = new LinkedHashSet<>(request.setIds() == null ? List.of() : request.setIds());
        Set<UUID> deckIds = new LinkedHashSet<>(request.deckIds() == null ? List.of() : request.deckIds());
        setIds.remove(null);
        deckIds.remove(null);
        if (!includeAll && setIds.isEmpty() && deckIds.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Select at least one set or deck");
        }
        if (!setIds.isEmpty()) {
            for (UUID setId : setIds) {
                groupRepository
                        .findByIdAndUserId(setId, userId)
                        .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Set not found"));
            }
        }
        if (!deckIds.isEmpty()) {
            List<Deck> owned = deckRepository.findByIdInAndUser_Id(deckIds, userId);
            if (owned.size() != deckIds.size()) {
                throw new ApiException(HttpStatus.NOT_FOUND, "Deck not found");
            }
        }
        mix.setName(name);
        mix.setIncludeAll(includeAll);
        mix.getSetIds().clear();
        mix.getSetIds().addAll(setIds);
        mix.getDeckIds().clear();
        mix.getDeckIds().addAll(deckIds);
        mix.setUpdatedAt(Instant.now());
    }

    private StudyMixResponse toResponse(StudyMix mix) {
        List<UUID> deckIds = resolveDeckIds(mix);
        LocalDate today = LocalDate.now();
        int cardCount = 0;
        int dueCount = 0;
        int hardCount = 0;
        int againCount = 0;
        if (!deckIds.isEmpty()) {
            cardCount = cardRepository.countByDeck_IdIn(deckIds);
            dueCount = cardRepository.countStudyQueueIn(deckIds, today);
            hardCount = cardReviewRepository.countByDeckIdInAndLastRating(deckIds, ReviewRating.HARD);
            againCount = cardReviewRepository.countByDeckIdInAndLastRating(deckIds, ReviewRating.AGAIN);
        }
        return new StudyMixResponse(
                mix.getId(),
                mix.getName(),
                mix.isIncludeAll(),
                List.copyOf(mix.getSetIds()),
                List.copyOf(mix.getDeckIds()),
                deckIds.size(),
                cardCount,
                dueCount,
                hardCount,
                againCount,
                mix.getCreatedAt(),
                mix.getUpdatedAt());
    }

    private StudyMix requireOwned(UUID userId, UUID mixId) {
        return mixRepository
                .findByIdAndUserId(mixId, userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Study mix not found"));
    }

    private User requireProUser(UUID userId) {
        User user = userRepository
                .findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Not authenticated"));
        ProAccess.require(user);
        return user;
    }
}
