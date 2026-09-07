package com.flashcards.group;

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

import com.flashcards.deck.DeckResponse;
import com.flashcards.security.AuthSupport;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/groups")
public class GroupController {

    private final GroupService groupService;

    public GroupController(GroupService groupService) {
        this.groupService = groupService;
    }

    @GetMapping
    public List<GroupResponse> list(Authentication authentication) {
        return groupService.list(AuthSupport.requireUser(authentication).id());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public GroupResponse create(Authentication authentication, @Valid @RequestBody GroupRequest request) {
        return groupService.create(AuthSupport.requireUser(authentication).id(), request);
    }

    @GetMapping("/{id}")
    public GroupDetailResponse get(Authentication authentication, @PathVariable UUID id) {
        return groupService.get(AuthSupport.requireUser(authentication).id(), id);
    }

    @PutMapping("/{id}")
    public GroupResponse update(
            Authentication authentication,
            @PathVariable UUID id,
            @Valid @RequestBody GroupRequest request) {
        return groupService.update(AuthSupport.requireUser(authentication).id(), id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(Authentication authentication, @PathVariable UUID id) {
        groupService.delete(AuthSupport.requireUser(authentication).id(), id);
    }

    @PostMapping("/{id}/decks")
    public DeckResponse addDeck(
            Authentication authentication,
            @PathVariable UUID id,
            @Valid @RequestBody AddDeckRequest request) {
        return groupService.addDeck(AuthSupport.requireUser(authentication).id(), id, request.deckId());
    }

    @DeleteMapping("/{id}/decks/{deckId}")
    public DeckResponse removeDeck(
            Authentication authentication,
            @PathVariable UUID id,
            @PathVariable UUID deckId) {
        return groupService.removeDeck(AuthSupport.requireUser(authentication).id(), id, deckId);
    }
}
