package com.flashcards.card;

import java.util.UUID;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.flashcards.security.AuthSupport;

import jakarta.validation.Valid;

@RestController
public class CardController {

    private final CardService cardService;

    public CardController(CardService cardService) {
        this.cardService = cardService;
    }

    @GetMapping("/api/decks/{deckId}/cards")
    public List<CardResponse> list(Authentication authentication, @PathVariable UUID deckId) {
        return cardService.list(AuthSupport.requireUser(authentication).id(), deckId);
    }

    @PostMapping("/api/decks/{deckId}/cards")
    @ResponseStatus(HttpStatus.CREATED)
    public CardResponse create(
            Authentication authentication,
            @PathVariable UUID deckId,
            @Valid @RequestBody CardRequest request) {
        return cardService.create(AuthSupport.requireUser(authentication).id(), deckId, request);
    }

    @PutMapping("/api/decks/{deckId}/cards/order")
    public List<CardResponse> reorder(
            Authentication authentication,
            @PathVariable UUID deckId,
            @Valid @RequestBody ReorderCardsRequest request) {
        return cardService.reorder(AuthSupport.requireUser(authentication).id(), deckId, request.cardIds());
    }

    @PutMapping("/api/cards/{id}")
    public CardResponse update(
            Authentication authentication,
            @PathVariable UUID id,
            @Valid @RequestBody CardRequest request) {
        return cardService.update(AuthSupport.requireUser(authentication).id(), id, request);
    }

    @DeleteMapping("/api/cards/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(Authentication authentication, @PathVariable UUID id) {
        cardService.delete(AuthSupport.requireUser(authentication).id(), id);
    }
}
