package com.flashcards.studio;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.flashcards.security.AuthSupport;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/language-studio/playlists")
public class ConversationPlaylistController {

    private final ConversationPlaylistService playlistService;

    public ConversationPlaylistController(ConversationPlaylistService playlistService) {
        this.playlistService = playlistService;
    }

    @GetMapping
    public List<ConversationPlaylistResponse> list(
            Authentication authentication,
            @RequestParam(required = false) String nativeLanguage,
            @RequestParam(required = false) String targetLanguage) {
        return playlistService.list(AuthSupport.requireUser(authentication).id(), nativeLanguage, targetLanguage);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ConversationPlaylistResponse create(
            Authentication authentication, @Valid @RequestBody ConversationPlaylistRequest request) {
        return playlistService.create(AuthSupport.requireUser(authentication).id(), request);
    }

    @GetMapping("/{playlistId}")
    public ConversationPlaylistResponse get(Authentication authentication, @PathVariable UUID playlistId) {
        return playlistService.get(AuthSupport.requireUser(authentication).id(), playlistId);
    }

    @GetMapping("/{playlistId}/listen")
    public ConversationPlaylistListenResponse listen(Authentication authentication, @PathVariable UUID playlistId) {
        return playlistService.listen(AuthSupport.requireUser(authentication).id(), playlistId);
    }

    @PutMapping("/{playlistId}")
    public ConversationPlaylistResponse update(
            Authentication authentication,
            @PathVariable UUID playlistId,
            @Valid @RequestBody ConversationPlaylistRequest request) {
        return playlistService.update(AuthSupport.requireUser(authentication).id(), playlistId, request);
    }

    @DeleteMapping("/{playlistId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(Authentication authentication, @PathVariable UUID playlistId) {
        playlistService.delete(AuthSupport.requireUser(authentication).id(), playlistId);
    }
}
