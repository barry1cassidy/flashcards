package com.flashcards.card;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockMultipartFile;

import com.flashcards.common.ApiException;
import com.flashcards.deck.Deck;
import com.flashcards.security.OwnedAccess;
import com.flashcards.user.User;
import com.flashcards.user.UserRepository;

@ExtendWith(MockitoExtension.class)
class CardImageServiceTest {

    @Mock
    private CardImageStore store;
    @Mock
    private OwnedAccess ownedAccess;
    @Mock
    private UserRepository userRepository;

    private CardImageService service;
    private User user;
    private Card card;
    private final UUID userId = UUID.fromString("00000000-0000-0000-0000-000000000011");
    private final UUID cardId = UUID.fromString("00000000-0000-0000-0000-000000000022");

    @BeforeEach
    void setUp() throws Exception {
        CardImageProperties properties =
                new CardImageProperties("local", "./data/card-images", "", "us-east-1", "", "card-images", 5_000_000, 1600);
        service = new CardImageService(store, properties, ownedAccess, userRepository);
        user = new User();
        user.setId(userId);
        user.setProLicensed(true);
        user.setEmail("pro@example.com");
        user.setDisplayName("Pro");
        Deck deck = new Deck();
        deck.setUpdatedAt(Instant.parse("2026-01-01T00:00:00Z"));
        card = new Card();
        card.setId(cardId);
        card.setFront("hola");
        card.setBack("hello");
        card.setDeck(deck);
    }

    @Test
    void saveRequiresPro() throws Exception {
        user.setProLicensed(false);
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        ApiException ex = assertThrows(
                ApiException.class,
                () -> service.save(userId, cardId, CardImageSide.FRONT, pngFile()));
        assertEquals(HttpStatus.FORBIDDEN, ex.getStatus());
        assertEquals("Pro license required", ex.getMessage());
        verify(store, never()).put(any(), any());
    }

    @Test
    void saveStoresJpegAndHash() throws Exception {
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(ownedAccess.requireCard(userId, cardId)).thenReturn(card);
        CardResponse response = service.save(userId, cardId, CardImageSide.FRONT, pngFile());
        ArgumentCaptor<byte[]> bytes = ArgumentCaptor.forClass(byte[].class);
        verify(store).put(eq("card-images/" + cardId + "/front.jpg"), bytes.capture());
        assertTrue(bytes.getValue().length > 0);
        assertTrue(card.getFrontImage() != null && card.getFrontImage().length() == 64);
        assertTrue(response.hasFrontImage());
    }

    @Test
    void copyUsesSourceBytes() {
        UUID destId = UUID.fromString("00000000-0000-0000-0000-000000000033");
        card.setFrontImage("abc");
        Card dest = new Card();
        dest.setId(destId);
        byte[] jpeg = {1, 2, 3};
        when(store.get("card-images/" + cardId + "/front.jpg")).thenReturn(Optional.of(jpeg));
        service.copyFrom(card, dest);
        verify(store).put("card-images/" + destId + "/front.jpg", jpeg);
        assertEquals("abc", dest.getFrontImage());
    }

    @Test
    void deleteClearsHash() {
        card.setFrontImage("abc");
        when(ownedAccess.requireCard(userId, cardId)).thenReturn(card);
        service.delete(userId, cardId, CardImageSide.FRONT);
        verify(store).delete("card-images/" + cardId + "/front.jpg");
        assertEquals(null, card.getFrontImage());
    }

    private static MockMultipartFile pngFile() throws Exception {
        return new MockMultipartFile(
                "file", "photo.png", "image/png", CardImageProcessorTest.png(16, 16));
    }
}
