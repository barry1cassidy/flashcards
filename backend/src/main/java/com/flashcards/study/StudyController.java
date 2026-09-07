package com.flashcards.study;

import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.flashcards.security.AuthSupport;

import jakarta.validation.Valid;

@RestController
public class StudyController {

    private final StudyService studyService;

    public StudyController(StudyService studyService) {
        this.studyService = studyService;
    }

    @GetMapping("/api/decks/{deckId}/study")
    public StudySessionResponse start(
            Authentication authentication,
            @PathVariable UUID deckId,
            @RequestParam(defaultValue = "flip") String mode) {
        return studyService.startSession(AuthSupport.requireUser(authentication).id(), deckId, mode);
    }

    @PostMapping("/api/cards/{id}/review")
    public ReviewResponse review(
            Authentication authentication,
            @PathVariable UUID id,
            @Valid @RequestBody ReviewRequest request) {
        return studyService.review(AuthSupport.requireUser(authentication).id(), id, request.rating());
    }

    @PostMapping("/api/study/reset-due")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void resetDue(Authentication authentication) {
        studyService.resetDueDates(AuthSupport.requireUser(authentication).id());
    }
}
