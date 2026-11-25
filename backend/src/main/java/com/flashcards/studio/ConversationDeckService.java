package com.flashcards.studio;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.flashcards.billing.ExpiredStoreSubscriptionRefresh;
import com.flashcards.billing.ProAccess;
import com.flashcards.card.CardRequest;
import com.flashcards.card.CardService;
import com.flashcards.common.ApiException;
import com.flashcards.deck.DeckRepository;
import com.flashcards.deck.DeckRequest;
import com.flashcards.deck.DeckResponse;
import com.flashcards.deck.DeckService;
import com.flashcards.security.OwnedAccess;
import com.flashcards.user.User;
import com.flashcards.user.UserRepository;

@Service
public class ConversationDeckService {

    private final LanguageConversationRepository conversationRepository;
    private final UserRepository userRepository;
    private final ExpiredStoreSubscriptionRefresh expiredStoreSubscriptionRefresh;
    private final DeckService deckService;
    private final DeckRepository deckRepository;
    private final CardService cardService;

    public ConversationDeckService(
            LanguageConversationRepository conversationRepository,
            UserRepository userRepository,
            ExpiredStoreSubscriptionRefresh expiredStoreSubscriptionRefresh,
            DeckService deckService,
            DeckRepository deckRepository,
            CardService cardService) {
        this.conversationRepository = conversationRepository;
        this.userRepository = userRepository;
        this.expiredStoreSubscriptionRefresh = expiredStoreSubscriptionRefresh;
        this.deckService = deckService;
        this.deckRepository = deckRepository;
        this.cardService = cardService;
    }

    @Transactional
    public LanguageConversationResponse create(UUID userId, UUID conversationId) {
        requireProUser(userId);
        LanguageConversation conversation = conversationRepository
                .findByIdAndUser_Id(conversationId, userId)
                .orElseThrow(() -> OwnedAccess.hidden("Conversation not found"));
        if (conversation.getDeckId() != null) {
            try {
                deckService.requireOwned(userId, conversation.getDeckId());
                return LanguageStudioService.toResponse(conversation, true);
            } catch (ApiException ex) {
                conversation.setDeckId(null);
            }
        }
        List<CardRequest> phrases = phrases(conversation.getTurns());
        if (phrases.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "This conversation has no lines to turn into cards");
        }
        DeckResponse deck = deckService.create(
                userId,
                new DeckRequest(
                        uniqueName(userId, conversation.getTitle()),
                        null,
                        null,
                        conversation.getNativeLanguage(),
                        conversation.getTargetLanguage()),
                "zipconvo");
        for (CardRequest phrase : phrases) {
            cardService.create(userId, deck.id(), phrase);
        }
        conversation.setDeckId(deck.id());
        conversationRepository.save(conversation);
        return LanguageStudioService.toResponse(conversation, true);
    }

    static List<CardRequest> phrases(List<LanguageTurn> turns) {
        if (turns == null || turns.isEmpty()) {
            return List.of();
        }
        List<CardRequest> cards = new ArrayList<>();
        Set<String> seen = new LinkedHashSet<>();
        for (LanguageTurn turn : turns) {
            String front = turn.getNativeText() == null ? "" : turn.getNativeText().trim();
            String back = turn.getTargetText() == null ? "" : turn.getTargetText().trim();
            if (front.isEmpty() || back.isEmpty()) {
                continue;
            }
            if (!seen.add(front + "\n" + back)) {
                continue;
            }
            cards.add(new CardRequest(front, back, null));
        }
        return cards;
    }

    private String uniqueName(UUID userId, String title) {
        String base = title == null ? "" : title.trim();
        if (base.isBlank()) {
            base = "Conversation";
        }
        if (base.length() > 180) {
            base = base.substring(0, 180).trim();
        }
        String name = base;
        int suffix = 2;
        while (deckRepository.existsByUser_IdAndNameIgnoreCase(userId, name)) {
            name = base + " " + suffix;
            suffix++;
            if (suffix > 100) {
                throw new ApiException(HttpStatus.CONFLICT, "You already have a deck with that name");
            }
        }
        return name;
    }

    private User requireProUser(UUID userId) {
        expiredStoreSubscriptionRefresh.refresh(userId);
        User user = userRepository
                .findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Not authenticated"));
        ProAccess.require(user);
        return user;
    }
}
