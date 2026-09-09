package com.flashcards.card;

import java.util.UUID;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.flashcards.common.ApiException;
import com.flashcards.deck.Deck;
import com.flashcards.deck.DeckService;

@Service
public class CardService {

    private final CardRepository cardRepository;
    private final DeckService deckService;

    public CardService(CardRepository cardRepository, DeckService deckService) {
        this.cardRepository = cardRepository;
        this.deckService = deckService;
    }

    @Transactional(readOnly = true)
    public List<CardResponse> list(UUID userId, UUID deckId) {
        deckService.requireOwned(userId, deckId);
        return cardRepository.findByDeckIdOrderByPositionAscIdAsc(deckId).stream()
                .map(CardService::toResponse)
                .toList();
    }

    @Transactional
    public int createMany(UUID userId, UUID deckId, List<CardDraft> drafts) {
        Deck deck = deckService.requireOwned(userId, deckId);
        int position = cardRepository.countByDeckId(deckId);
        int added = 0;
        for (CardDraft draft : drafts) {
            if (draft == null || draft.front() == null || draft.front().isBlank()
                    || draft.back() == null || draft.back().isBlank()) {
                continue;
            }
            Card card = new Card();
            card.setDeck(deck);
            card.setFront(draft.front().trim());
            card.setBack(draft.back().trim());
            card.setHint(trimToNull(draft.hint()));
            card.setPosition(position++);
            cardRepository.save(card);
            added++;
        }
        if (added > 0) {
            deck.setUpdatedAt(java.time.Instant.now());
        }
        return added;
    }

    @Transactional
    public CardResponse create(UUID userId, UUID deckId, CardRequest request) {
        Deck deck = deckService.requireOwned(userId, deckId);
        Card card = new Card();
        card.setDeck(deck);
        card.setFront(request.front().trim());
        card.setBack(request.back().trim());
        card.setHint(trimToNull(request.hint()));
        card.setPosition(cardRepository.countByDeckId(deckId));
        cardRepository.save(card);
        deck.setUpdatedAt(java.time.Instant.now());
        return toResponse(card);
    }

    @Transactional
    public CardResponse update(UUID userId, UUID cardId, CardRequest request) {
        Card card = requireOwnedCard(userId, cardId);
        card.setFront(request.front().trim());
        card.setBack(request.back().trim());
        card.setHint(trimToNull(request.hint()));
        card.getDeck().setUpdatedAt(java.time.Instant.now());
        return toResponse(card);
    }

    @Transactional
    public void delete(UUID userId, UUID cardId) {
        Card card = requireOwnedCard(userId, cardId);
        UUID deckId = card.getDeck().getId();
        cardRepository.delete(card);
        reindex(deckId);
    }

    @Transactional
    public List<CardResponse> reorder(UUID userId, UUID deckId, List<UUID> cardIds) {
        Deck deck = deckService.requireOwned(userId, deckId);
        List<Card> cards = cardRepository.findByDeckIdOrderByPositionAscIdAsc(deckId);
        if (cards.size() != cardIds.size() || cardIds.size() != new java.util.HashSet<>(cardIds).size()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Card list does not match this deck");
        }
        java.util.Map<UUID, Card> byId = cards.stream().collect(java.util.stream.Collectors.toMap(Card::getId, card -> card));
        for (UUID cardId : cardIds) {
            if (!byId.containsKey(cardId)) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Card list does not match this deck");
            }
        }
        for (int i = 0; i < cardIds.size(); i++) {
            byId.get(cardIds.get(i)).setPosition(i);
        }
        deck.setUpdatedAt(java.time.Instant.now());
        return cardIds.stream().map(id -> toResponse(byId.get(id))).toList();
    }

    private void reindex(UUID deckId) {
        List<Card> cards = cardRepository.findByDeckIdOrderByPositionAscIdAsc(deckId);
        for (int i = 0; i < cards.size(); i++) {
            cards.get(i).setPosition(i);
        }
    }

    public Card requireOwnedCard(UUID userId, UUID cardId) {
        return cardRepository.findByIdAndDeckUserId(cardId, userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Card not found"));
    }

    public static CardResponse toResponse(Card card) {
        return new CardResponse(card.getId(), card.getFront(), card.getBack(), card.getHint(), card.getPosition());
    }

    public static String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
