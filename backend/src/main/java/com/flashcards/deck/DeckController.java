package com.flashcards.deck;

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
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.flashcards.security.AuthSupport;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/decks")
public class DeckController {

    private final DeckService deckService;

    public DeckController(DeckService deckService) {
        this.deckService = deckService;
    }

    @GetMapping
    public List<DeckResponse> list(Authentication authentication) {
        return deckService.list(AuthSupport.requireUser(authentication).id());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public DeckResponse create(Authentication authentication, @Valid @RequestBody DeckRequest request) {
        return deckService.create(AuthSupport.requireUser(authentication).id(), request);
    }

    @GetMapping("/{id}")
    public DeckResponse get(Authentication authentication, @PathVariable UUID id) {
        return deckService.get(AuthSupport.requireUser(authentication).id(), id);
    }

    @PutMapping("/{id}")
    public DeckResponse update(
            Authentication authentication,
            @PathVariable UUID id,
            @Valid @RequestBody DeckRequest request) {
        return deckService.update(AuthSupport.requireUser(authentication).id(), id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(Authentication authentication, @PathVariable UUID id) {
        deckService.delete(AuthSupport.requireUser(authentication).id(), id);
    }
}
