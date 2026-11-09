package com.flashcards.auth;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
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

import com.flashcards.common.ApiException;
import com.flashcards.user.User;

@ExtendWith(MockitoExtension.class)
class RefreshTokenServiceTest {

    @Mock
    private RefreshTokenRepository repository;

    private RefreshTokenService service;

    @BeforeEach
    void setUp() {
        service = new RefreshTokenService(repository);
    }

    @Test
    void issueStoresAHashAndReturnsADifferentSecret() {
        User user = new User();
        user.setId(UUID.fromString("00000000-0000-0000-0000-000000000041"));

        String raw = service.issue(user);

        ArgumentCaptor<RefreshToken> saved = ArgumentCaptor.forClass(RefreshToken.class);
        verify(repository).save(saved.capture());
        assertEquals(64, saved.getValue().getTokenHash().length());
        assertNotEquals(raw, saved.getValue().getTokenHash());
        assertEquals(RefreshTokenService.sha256(raw), saved.getValue().getTokenHash());
        assertTrue(saved.getValue().getExpiresAt().isAfter(Instant.now().plus(RefreshTokenService.TTL).minusSeconds(60)));
    }

    @Test
    void rotateRejectsAnExpiredToken() {
        RefreshToken row = new RefreshToken();
        row.setExpiresAt(Instant.now().minusSeconds(5));
        row.setUser(new User());
        when(repository.findByTokenHash(any())).thenReturn(Optional.of(row));

        ApiException ex = assertThrows(ApiException.class, () -> service.rotate("raw-token"));

        assertEquals(HttpStatus.UNAUTHORIZED, ex.getStatus());
    }

    @Test
    void rotateRevokesThePresentedToken() {
        User user = new User();
        user.setId(UUID.fromString("00000000-0000-0000-0000-000000000042"));
        RefreshToken row = new RefreshToken();
        row.setExpiresAt(Instant.now().plusSeconds(60));
        row.setUser(user);
        when(repository.findByTokenHash(RefreshTokenService.sha256("raw-token"))).thenReturn(Optional.of(row));

        User rotated = service.rotate("raw-token");

        assertEquals(user, rotated);
        assertTrue(row.getRevokedAt() != null);
        verify(repository).save(row);
    }
}
