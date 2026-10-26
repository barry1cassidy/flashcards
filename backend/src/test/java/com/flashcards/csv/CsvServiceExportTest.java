package com.flashcards.csv;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import com.flashcards.card.CardRepository;
import com.flashcards.common.ApiException;
import com.flashcards.deck.DeckService;
import com.flashcards.user.User;
import com.flashcards.user.UserRepository;

@ExtendWith(MockitoExtension.class)
class CsvServiceExportTest {

    @Mock
    private DeckService deckService;

    @Mock
    private CardRepository cardRepository;

    @Mock
    private UserRepository userRepository;

    private CsvService service;

    @BeforeEach
    void setUp() {
        service = new CsvService(deckService, cardRepository, userRepository);
    }

    @Test
    void exportRequiresPro() {
        UUID userId = UUID.randomUUID();
        User user = new User();
        user.setProLicensed(false);
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));

        ApiException error = assertThrows(ApiException.class, () -> service.exportCsv(userId, UUID.randomUUID()));

        assertEquals(HttpStatus.FORBIDDEN, error.getStatus());
        assertEquals("Pro license required", error.getMessage());
    }
}
