package com.flashcards.agent;

import java.util.UUID;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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

    @PostMapping("/decks")
    public AgentJobResponse createDeck(Authentication authentication, @Valid @RequestBody AgentCreateRequest request) {
        return agentService.startCreateDeck(AuthSupport.requireUser(authentication).id(), request);
    }

    @GetMapping("/jobs/{jobId}")
    public AgentJobResponse getJob(Authentication authentication, @PathVariable UUID jobId) {
        return agentService.getJob(AuthSupport.requireUser(authentication).id(), jobId);
    }
}
