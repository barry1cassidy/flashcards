package com.flashcards.csv;

import java.util.UUID;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.flashcards.card.Card;
import com.flashcards.card.CardRepository;
import com.flashcards.card.CardResponse;
import com.flashcards.card.CardService;
import com.flashcards.common.ApiException;
import com.flashcards.deck.Deck;
import com.flashcards.deck.DeckService;

@Service
public class CsvService {

    private final DeckService deckService;
    private final CardRepository cardRepository;

    public CsvService(DeckService deckService, CardRepository cardRepository) {
        this.deckService = deckService;
        this.cardRepository = cardRepository;
    }

    @Transactional
    public List<CardResponse> importCsv(UUID userId, UUID deckId, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "CSV file is required");
        }
        Deck deck = deckService.requireOwned(userId, deckId);
        List<String[]> rows;
        try (InputStream inputStream = file.getInputStream()) {
            rows = CsvParser.parse(inputStream);
        } catch (IOException ex) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Could not read CSV file");
        }
        if (rows.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "CSV file is empty");
        }
        int start = 0;
        if (isHeader(rows.get(0))) {
            start = 1;
        }
        int position = cardRepository.countByDeckId(deckId);
        List<Card> created = new ArrayList<>();
        for (int i = start; i < rows.size(); i++) {
            String[] row = rows.get(i);
            if (row.length < 2) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Each row needs a front and back column");
            }
            String front = row[0] == null ? "" : row[0].trim();
            String back = row[1] == null ? "" : row[1].trim();
            if (front.isEmpty() && back.isEmpty()) {
                continue;
            }
            if (front.isEmpty() || back.isEmpty()) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Each card needs both a front and a back");
            }
            Card card = new Card();
            card.setDeck(deck);
            card.setFront(front);
            card.setBack(back);
            card.setHint(row.length == 3 ? CardService.trimToNull(row[2]) : null);
            card.setPosition(position++);
            created.add(card);
        }
        if (created.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "No cards found in CSV");
        }
        cardRepository.saveAll(created);
        deck.setUpdatedAt(java.time.Instant.now());
        return created.stream().map(CardService::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public byte[] exportCsv(UUID userId, UUID deckId) {
        deckService.requireOwned(userId, deckId);
        StringBuilder csv = new StringBuilder("front,back,hint\n");
        for (Card card : cardRepository.findByDeckIdOrderByPositionAscIdAsc(deckId)) {
            csv.append(CsvParser.escape(card.getFront()))
                    .append(',')
                    .append(CsvParser.escape(card.getBack()))
                    .append(',')
                    .append(CsvParser.escape(card.getHint()))
                    .append('\n');
        }
        return csv.toString().getBytes(StandardCharsets.UTF_8);
    }

    private static boolean isHeader(String[] row) {
        if (row.length < 2) {
            return false;
        }
        String front = row[0].trim().toLowerCase(Locale.ROOT);
        String back = row[1].trim().toLowerCase(Locale.ROOT);
        return ("front".equals(front) || "question".equals(front))
                && ("back".equals(back) || "answer".equals(back));
    }
}
