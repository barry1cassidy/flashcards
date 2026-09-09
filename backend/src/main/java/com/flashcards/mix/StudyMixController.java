package com.flashcards.mix;

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
import com.flashcards.study.StudySessionResponse;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/mixes")
public class StudyMixController {

    private final StudyMixService mixService;

    public StudyMixController(StudyMixService mixService) {
        this.mixService = mixService;
    }

    @GetMapping
    public java.util.List<StudyMixResponse> list(Authentication authentication) {
        return mixService.list(AuthSupport.requireUser(authentication).id());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public StudyMixResponse create(Authentication authentication, @Valid @RequestBody StudyMixRequest request) {
        return mixService.create(AuthSupport.requireUser(authentication).id(), request);
    }

    @GetMapping("/{mixId}")
    public StudyMixResponse get(Authentication authentication, @PathVariable UUID mixId) {
        return mixService.get(AuthSupport.requireUser(authentication).id(), mixId);
    }

    @PutMapping("/{mixId}")
    public StudyMixResponse update(
            Authentication authentication, @PathVariable UUID mixId, @Valid @RequestBody StudyMixRequest request) {
        return mixService.update(AuthSupport.requireUser(authentication).id(), mixId, request);
    }

    @DeleteMapping("/{mixId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(Authentication authentication, @PathVariable UUID mixId) {
        mixService.delete(AuthSupport.requireUser(authentication).id(), mixId);
    }

    @GetMapping("/{mixId}/study")
    public StudySessionResponse start(
            Authentication authentication,
            @PathVariable UUID mixId,
            @RequestParam(defaultValue = "flip") String mode,
            @RequestParam(defaultValue = "due") String filter) {
        return mixService.startSession(AuthSupport.requireUser(authentication).id(), mixId, mode, filter);
    }

    @PostMapping("/{mixId}/study/reset-due")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void resetDue(Authentication authentication, @PathVariable UUID mixId) {
        mixService.resetDueDates(AuthSupport.requireUser(authentication).id(), mixId);
    }

    @PostMapping("/{mixId}/study/continue")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void continueMix(Authentication authentication, @PathVariable UUID mixId) {
        mixService.continueNextBatch(AuthSupport.requireUser(authentication).id(), mixId);
    }
}
