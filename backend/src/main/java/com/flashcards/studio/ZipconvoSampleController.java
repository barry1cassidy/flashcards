package com.flashcards.studio;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.flashcards.security.AuthSupport;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/zipconvo/samples")
public class ZipconvoSampleController {

    private final LanguageStudioCatalogService catalogService;

    public ZipconvoSampleController(LanguageStudioCatalogService catalogService) {
        this.catalogService = catalogService;
    }

    @GetMapping
    public List<LanguageStudioSampleSummary> list(
            Authentication authentication,
            @RequestParam String nativeLanguage,
            @RequestParam String targetLanguage) {
        return catalogService.listOpen(AuthSupport.requireUser(authentication).id(), nativeLanguage, targetLanguage);
    }

    @GetMapping("/{slug}")
    public LanguageStudioSampleResponse get(
            Authentication authentication,
            @PathVariable String slug,
            @RequestParam String nativeLanguage,
            @RequestParam String targetLanguage) {
        return catalogService.getOpen(
                AuthSupport.requireUser(authentication).id(), slug, nativeLanguage, targetLanguage);
    }

    @PostMapping("/{slug}/copy")
    @ResponseStatus(HttpStatus.CREATED)
    public LanguageConversationResponse copy(
            Authentication authentication,
            @PathVariable String slug,
            @Valid @RequestBody LanguageStudioCopySampleRequest request) {
        return catalogService.copyOpen(
                AuthSupport.requireUser(authentication).id(), slug, request.nativeLanguage(), request.targetLanguage());
    }
}
