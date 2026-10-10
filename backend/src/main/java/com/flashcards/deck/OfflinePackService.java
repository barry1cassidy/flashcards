package com.flashcards.deck;

import java.util.UUID;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.flashcards.billing.ProAccess;
import com.flashcards.card.Card;
import com.flashcards.card.CardRepository;
import com.flashcards.common.ApiException;
import com.flashcards.user.User;
import com.flashcards.user.UserRepository;

@Service
public class OfflinePackService {

    private final UserRepository userRepository;
    private final DeckService deckService;
    private final CardRepository cardRepository;

    public OfflinePackService(UserRepository userRepository, DeckService deckService, CardRepository cardRepository) {
        this.userRepository = userRepository;
        this.deckService = deckService;
        this.cardRepository = cardRepository;
    }

    @Transactional(readOnly = true)
    public OfflinePackResponse snapshot(UUID userId, UUID deckId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Not authenticated"));
        ProAccess.require(user);
        Deck deck = deckService.requireOwned(userId, deckId);
        List<OfflineCardResponse> cards = cardRepository.findByDeckIdOrderByPositionAscIdAsc(deckId).stream()
                .filter(OfflinePackService::hasText)
                .map(OfflinePackService::toCard)
                .toList();
        return new OfflinePackResponse(
                deck.getId(),
                deck.getName(),
                deck.getDescription(),
                deck.getFrontLanguage(),
                deck.getBackLanguage(),
                cards);
    }

    private static boolean hasText(Card card) {
        return text(card.getFront()) || text(card.getBack());
    }

    private static boolean text(String value) {
        return value != null && !value.isBlank();
    }

    private static OfflineCardResponse toCard(Card card) {
        return new OfflineCardResponse(card.getId(), card.getFront(), card.getBack(), card.getHint(), card.getPosition());
    }
}
