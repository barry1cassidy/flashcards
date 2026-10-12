package com.flashcards.library;

import java.util.UUID;
import java.util.List;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.flashcards.deck.DeckResponse;
import com.flashcards.security.AuthSupport;

@RestController
@RequestMapping("/api/library")
public class LibraryController {

    private final LibraryService libraryService;

    public LibraryController(LibraryService libraryService) {
        this.libraryService = libraryService;
    }

    @GetMapping
    public List<LibraryGroupResponse> list(
            Authentication authentication, @RequestParam(required = false) String q) {
        return libraryService.list(AuthSupport.optionalUserId(authentication), q);
    }

    @GetMapping("/groups/{id}")
    public LibraryGroupResponse getGroup(Authentication authentication, @PathVariable String id) {
        UUID userId = AuthSupport.optionalUserId(authentication);
        if (isUuid(id)) {
            return libraryService.getGroup(userId, UUID.fromString(id));
        }
        return libraryService.getGroupBySlug(userId, id);
    }

    @GetMapping("/decks/{id}")
    public LibraryDeckResponse getDeck(Authentication authentication, @PathVariable UUID id) {
        return libraryService.getDeck(AuthSupport.optionalUserId(authentication), id);
    }

    @GetMapping("/decks/{groupSlug}/{deckSlug}")
    public LibraryDeckResponse getDeckBySlug(
            Authentication authentication, @PathVariable String groupSlug, @PathVariable String deckSlug) {
        return libraryService.getDeckBySlug(AuthSupport.optionalUserId(authentication), groupSlug, deckSlug);
    }

    @PostMapping("/decks/{id}/add")
    public DeckResponse add(Authentication authentication, @PathVariable UUID id) {
        return libraryService.addToMyDecks(AuthSupport.requireUser(authentication).id(), id);
    }

    private static boolean isUuid(String value) {
        try {
            UUID.fromString(value);
            return true;
        } catch (IllegalArgumentException ex) {
            return false;
        }
    }
}
