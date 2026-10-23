package com.flashcards.translate;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.flashcards.security.AuthSupport;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/translate")
public class TranslateController {

    private final TranslateService translateService;

    public TranslateController(TranslateService translateService) {
        this.translateService = translateService;
    }

    @PostMapping
    public TranslateResponse translate(Authentication authentication, @Valid @RequestBody TranslateRequest request) {
        AuthSupport.requireUser(authentication);
        return new TranslateResponse(translateService.translate(request.text(), request.source(), request.target()));
    }
}
