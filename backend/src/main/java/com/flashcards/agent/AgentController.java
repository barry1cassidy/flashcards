package com.flashcards.agent;

import java.util.UUID;

import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.flashcards.security.AuthSupport;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/agent")
public class AgentController {

    private final AgentService agentService;

    public AgentController(AgentService agentService) {
        this.agentService = agentService;
    }

    @GetMapping("/status")
    public AgentStatusResponse status(Authentication authentication) {
        return agentService.status(AuthSupport.requireUser(authentication).id());
    }

    @PostMapping(path = "/decks", consumes = MediaType.APPLICATION_JSON_VALUE)
    public AgentJobResponse createDeck(Authentication authentication, @Valid @RequestBody AgentCreateRequest request) {
        return agentService.startCreateDeck(AuthSupport.requireUser(authentication).id(), request, null);
    }

    @PostMapping(path = "/decks", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public AgentJobResponse createDeckFromFile(
            Authentication authentication,
            @RequestParam(value = "prompt", required = false) String prompt,
            @RequestParam(value = "setId", required = false) UUID setId,
            @RequestParam(value = "frontLanguage", required = false) String frontLanguage,
            @RequestParam(value = "backLanguage", required = false) String backLanguage,
            @RequestParam(value = "file", required = false) MultipartFile file) {
        return agentService.startCreateDeck(
                AuthSupport.requireUser(authentication).id(),
                new AgentCreateRequest(prompt, setId, frontLanguage, backLanguage),
                file);
    }

    @PostMapping(path = "/decks/{deckId}/edits", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<AgentJobResponse> editDeck(
            Authentication authentication,
            @PathVariable UUID deckId,
            @RequestParam(value = "jobId", required = false) UUID jobId,
            @Valid @RequestBody AgentEditRequest request) {
        AgentEditRequest resolved = jobId == null ? request : new AgentEditRequest(request.instruction(), jobId);
        return jobResponse(agentService.startEditDeck(
                AuthSupport.requireUser(authentication).id(), deckId, resolved));
    }

    @GetMapping("/jobs/{jobId}")
    public ResponseEntity<AgentJobResponse> getJob(Authentication authentication, @PathVariable UUID jobId) {
        return jobResponse(agentService.getJob(AuthSupport.requireUser(authentication).id(), jobId));
    }

    private static ResponseEntity<AgentJobResponse> jobResponse(AgentJobResponse job) {
        return ResponseEntity.ok()
                .cacheControl(CacheControl.noStore())
                .header(HttpHeaders.CONNECTION, "close")
                .body(job);
    }
}
