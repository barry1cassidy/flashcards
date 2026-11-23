package com.flashcards.speech;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.flashcards.security.AuthSupport;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/speech")
public class SpeechController {

    private final SpeechService speechService;

    public SpeechController(SpeechService speechService) {
        this.speechService = speechService;
    }

    @PostMapping(produces = "audio/mpeg")
    public ResponseEntity<byte[]> speak(Authentication authentication, @Valid @RequestBody SpeechRequest request) {
        AuthSupport.requireUser(authentication);
        byte[] audio = speechService.synthesize(request.text(), request.lang());
        return ResponseEntity.ok().contentType(MediaType.parseMediaType("audio/mpeg")).body(audio);
    }
}
