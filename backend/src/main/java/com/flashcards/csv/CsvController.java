package com.flashcards.csv;

import java.util.UUID;
import java.util.List;

import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.flashcards.card.CardResponse;
import com.flashcards.security.AuthSupport;

@RestController
public class CsvController {

    private final CsvService csvService;

    public CsvController(CsvService csvService) {
        this.csvService = csvService;
    }

    @PostMapping("/api/decks/{deckId}/import")
    @ResponseStatus(HttpStatus.CREATED)
    public List<CardResponse> importCsv(
            Authentication authentication,
            @PathVariable UUID deckId,
            @RequestParam("file") MultipartFile file) {
        return csvService.importCsv(AuthSupport.requireUser(authentication).id(), deckId, file);
    }

    @GetMapping("/api/decks/{deckId}/export")
    public ResponseEntity<byte[]> exportCsv(Authentication authentication, @PathVariable UUID deckId) {
        byte[] body = csvService.exportCsv(AuthSupport.requireUser(authentication).id(), deckId);
        ContentDisposition disposition = ContentDisposition.attachment()
                .filename("deck-" + deckId + ".csv")
                .build();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, disposition.toString())
                .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
                .body(body);
    }
}
