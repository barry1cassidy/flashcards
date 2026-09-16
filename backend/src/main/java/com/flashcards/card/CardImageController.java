package com.flashcards.card;

import java.util.UUID;
import java.util.concurrent.TimeUnit;

import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.flashcards.security.AuthSupport;

@RestController
public class CardImageController {

    private final CardImageService cardImageService;

    public CardImageController(CardImageService cardImageService) {
        this.cardImageService = cardImageService;
    }

    @PostMapping("/api/cards/{id}/images/{side}")
    public CardResponse upload(
            Authentication authentication,
            @PathVariable UUID id,
            @PathVariable String side,
            @RequestParam("file") MultipartFile file) {
        return cardImageService.save(
                AuthSupport.requireUser(authentication).id(), id, CardImageSide.fromPath(side), file);
    }

    @DeleteMapping("/api/cards/{id}/images/{side}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(Authentication authentication, @PathVariable UUID id, @PathVariable String side) {
        cardImageService.delete(AuthSupport.requireUser(authentication).id(), id, CardImageSide.fromPath(side));
    }

    @GetMapping("/api/cards/{id}/images/{side}")
    public ResponseEntity<byte[]> get(Authentication authentication, @PathVariable UUID id, @PathVariable String side) {
        byte[] bytes = cardImageService.load(
                AuthSupport.requireUser(authentication).id(), id, CardImageSide.fromPath(side));
        return ResponseEntity.ok()
                .contentType(MediaType.IMAGE_JPEG)
                .cacheControl(CacheControl.maxAge(1, TimeUnit.HOURS).cachePrivate())
                .body(bytes);
    }
}
