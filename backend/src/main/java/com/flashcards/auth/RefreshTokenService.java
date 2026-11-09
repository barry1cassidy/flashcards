package com.flashcards.auth;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.flashcards.common.ApiException;
import com.flashcards.user.User;

@Service
public class RefreshTokenService {

    static final Duration TTL = Duration.ofDays(400);

    private final RefreshTokenRepository repository;
    private final SecureRandom random = new SecureRandom();

    public RefreshTokenService(RefreshTokenRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public String issue(User user) {
        String raw = newToken();
        RefreshToken row = new RefreshToken();
        row.setUser(user);
        row.setTokenHash(sha256(raw));
        row.setExpiresAt(Instant.now().plus(TTL));
        row.setCreatedAt(Instant.now());
        repository.save(row);
        return raw;
    }

    @Transactional
    public User rotate(String raw) {
        RefreshToken row = repository.findByTokenHash(sha256(raw))
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Not authenticated"));
        if (row.getRevokedAt() != null || row.getExpiresAt().isBefore(Instant.now())) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Not authenticated");
        }
        row.setRevokedAt(Instant.now());
        repository.save(row);
        return row.getUser();
    }

    @Transactional
    public void revoke(String raw) {
        if (raw == null || raw.isBlank()) {
            return;
        }
        repository.findByTokenHash(sha256(raw)).ifPresent(row -> {
            if (row.getRevokedAt() == null) {
                row.setRevokedAt(Instant.now());
                repository.save(row);
            }
        });
    }

    @Transactional
    public void revokeAll(User user) {
        if (user == null || user.getId() == null) {
            return;
        }
        repository.revokeActive(user.getId(), Instant.now());
    }

    private String newToken() {
        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    static String sha256(String value) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(value.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder(digest.length * 2);
            for (byte item : digest) {
                hex.append(String.format("%02x", Byte.toUnsignedInt(item)));
            }
            return hex.toString();
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException(ex);
        }
    }
}
