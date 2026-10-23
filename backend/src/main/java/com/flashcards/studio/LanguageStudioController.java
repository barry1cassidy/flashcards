package com.flashcards.studio;

import java.util.List;
import java.util.UUID;

import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
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
@RequestMapping("/api/language-studio")
public class LanguageStudioController {

    private final LanguageStudioService studioService;
    private final LanguageStudioPairService pairService;
    private final LanguageStudioCatalogService catalogService;

    public LanguageStudioController(
            LanguageStudioService studioService,
            LanguageStudioPairService pairService,
            LanguageStudioCatalogService catalogService) {
        this.studioService = studioService;
        this.pairService = pairService;
        this.catalogService = catalogService;
    }

    @GetMapping("/pairs")
    public List<LanguageStudioPairResponse> listPairs(Authentication authentication) {
        return pairService.list(AuthSupport.requireUser(authentication).id());
    }

    @GetMapping("/conversations")
    public List<LanguageConversationResponse> list(
            Authentication authentication,
            @RequestParam(required = false) String nativeLanguage,
            @RequestParam(required = false) String targetLanguage) {
        return studioService.list(AuthSupport.requireUser(authentication).id(), nativeLanguage, targetLanguage);
    }

    @PostMapping("/conversations")
    public ResponseEntity<LanguageStudioJobResponse> create(
            Authentication authentication, @Valid @RequestBody LanguageStudioCreateRequest request) {
        return jobResponse(studioService.startGenerate(AuthSupport.requireUser(authentication).id(), request));
    }

    @GetMapping("/conversations/{conversationId}")
    public LanguageConversationResponse get(Authentication authentication, @PathVariable UUID conversationId) {
        return studioService.get(AuthSupport.requireUser(authentication).id(), conversationId);
    }

    @PatchMapping("/conversations/{conversationId}")
    public LanguageConversationResponse rate(
            Authentication authentication,
            @PathVariable UUID conversationId,
            @Valid @RequestBody LanguageStudioRateRequest request) {
        return studioService.rate(AuthSupport.requireUser(authentication).id(), conversationId, request);
    }

    @DeleteMapping("/conversations/{conversationId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(Authentication authentication, @PathVariable UUID conversationId) {
        studioService.delete(AuthSupport.requireUser(authentication).id(), conversationId);
    }

    @GetMapping("/jobs/{jobId}")
    public ResponseEntity<LanguageStudioJobResponse> getJob(Authentication authentication, @PathVariable UUID jobId) {
        return jobResponse(studioService.getJob(AuthSupport.requireUser(authentication).id(), jobId));
    }

    @GetMapping("/samples")
    public List<LanguageStudioSampleSummary> listSamples(
            Authentication authentication,
            @RequestParam String nativeLanguage,
            @RequestParam String targetLanguage) {
        return catalogService.list(AuthSupport.requireUser(authentication).id(), nativeLanguage, targetLanguage);
    }

    @GetMapping("/samples/{slug}")
    public LanguageStudioSampleResponse getSample(
            Authentication authentication,
            @PathVariable String slug,
            @RequestParam String nativeLanguage,
            @RequestParam String targetLanguage) {
        return catalogService.get(AuthSupport.requireUser(authentication).id(), slug, nativeLanguage, targetLanguage);
    }

    @PostMapping("/samples/{slug}/copy")
    @ResponseStatus(HttpStatus.CREATED)
    public LanguageConversationResponse copySample(
            Authentication authentication,
            @PathVariable String slug,
            @Valid @RequestBody LanguageStudioCopySampleRequest request) {
        return catalogService.copy(
                AuthSupport.requireUser(authentication).id(), slug, request.nativeLanguage(), request.targetLanguage());
    }

    private static ResponseEntity<LanguageStudioJobResponse> jobResponse(LanguageStudioJobResponse job) {
        return ResponseEntity.ok()
                .cacheControl(CacheControl.noStore())
                .header(HttpHeaders.CONNECTION, "close")
                .body(job);
    }
}
