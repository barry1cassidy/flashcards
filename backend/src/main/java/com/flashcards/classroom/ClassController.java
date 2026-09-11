package com.flashcards.classroom;

import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.flashcards.deck.DeckResponse;
import com.flashcards.security.AuthSupport;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/classes")
public class ClassController {

    private final ClassService classService;

    public ClassController(ClassService classService) {
        this.classService = classService;
    }

    @GetMapping
    public ClassListResponse list(Authentication authentication) {
        return classService.list(AuthSupport.requireUser(authentication).id());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ClassDetailResponse create(Authentication authentication, @Valid @RequestBody ClassRequest request) {
        return classService.create(AuthSupport.requireUser(authentication).id(), request);
    }

    @GetMapping("/{id}")
    public ClassDetailResponse get(Authentication authentication, @PathVariable UUID id) {
        return classService.get(AuthSupport.requireUser(authentication).id(), id);
    }

    @PatchMapping("/{id}")
    public ClassDetailResponse update(
            Authentication authentication, @PathVariable UUID id, @Valid @RequestBody ClassRequest request) {
        return classService.update(AuthSupport.requireUser(authentication).id(), id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(Authentication authentication, @PathVariable UUID id) {
        classService.delete(AuthSupport.requireUser(authentication).id(), id);
    }

    @PostMapping("/{id}/join-code")
    public ClassDetailResponse regenerateJoinCode(Authentication authentication, @PathVariable UUID id) {
        return classService.regenerateJoinCode(AuthSupport.requireUser(authentication).id(), id);
    }

    @PostMapping("/{id}/decks")
    public ClassDetailResponse assignDeck(
            Authentication authentication, @PathVariable UUID id, @Valid @RequestBody AssignDeckRequest request) {
        return classService.assignDeck(AuthSupport.requireUser(authentication).id(), id, request.deckId());
    }

    @DeleteMapping("/{id}/decks/{deckId}")
    public ClassDetailResponse unassignDeck(
            Authentication authentication, @PathVariable UUID id, @PathVariable UUID deckId) {
        return classService.unassignDeck(AuthSupport.requireUser(authentication).id(), id, deckId);
    }

    @DeleteMapping("/{id}/members/{userId}")
    public ClassDetailResponse removeMember(
            Authentication authentication, @PathVariable UUID id, @PathVariable UUID userId) {
        return classService.removeMember(AuthSupport.requireUser(authentication).id(), id, userId);
    }

    @DeleteMapping("/{id}/membership")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void leave(Authentication authentication, @PathVariable UUID id) {
        classService.leave(AuthSupport.requireUser(authentication).id(), id);
    }

    @PostMapping("/{id}/decks/{deckId}/copy")
    public DeckResponse copy(
            Authentication authentication, @PathVariable UUID id, @PathVariable UUID deckId) {
        return classService.copyAssignedDeck(AuthSupport.requireUser(authentication).id(), id, deckId);
    }

    @PostMapping("/{id}/decks/{deckId}/update")
    public DeckResponse updateFromClass(
            Authentication authentication, @PathVariable UUID id, @PathVariable UUID deckId) {
        return classService.updateFromClass(AuthSupport.requireUser(authentication).id(), id, deckId);
    }
}
