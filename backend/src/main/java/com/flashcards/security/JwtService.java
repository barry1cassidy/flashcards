package com.flashcards.security;

import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.UUID;

import javax.crypto.SecretKey;

import org.springframework.stereotype.Service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

@Service
public class JwtService {

    private final JwtProperties properties;
    private final SecretKey key;

    public JwtService(JwtProperties properties) {
        this.properties = properties;
        this.key = Keys.hmacShaKeyFor(properties.secret().getBytes(StandardCharsets.UTF_8));
    }

    public String createToken(UserPrincipal principal) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + properties.expirationMs());
        return Jwts.builder()
                .subject(principal.id().toString())
                .claim("email", principal.email())
                .claim("displayName", principal.displayName())
                .issuedAt(now)
                .expiration(expiry)
                .signWith(key)
                .compact();
    }

    public UserPrincipal parse(String token) {
        Claims claims = Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
        UUID id = UUID.fromString(claims.getSubject());
        String email = claims.get("email", String.class);
        String displayName = claims.get("displayName", String.class);
        return new UserPrincipal(id, email, displayName);
    }
}
