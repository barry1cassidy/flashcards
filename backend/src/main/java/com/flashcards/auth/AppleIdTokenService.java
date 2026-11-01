package com.flashcards.auth;

import java.math.BigInteger;
import java.security.KeyFactory;
import java.security.PublicKey;
import java.security.spec.RSAPublicKeySpec;
import java.time.Duration;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import com.flashcards.common.ApiException;
import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;

@Service
public class AppleIdTokenService implements AppleTokenService {

    private static final String ISSUER = "https://appleid.apple.com";
    private static final String KEYS_URL = "https://appleid.apple.com/auth/keys";

    private final AppleProperties properties;
    private final RestClient restClient;
    private final Object lock = new Object();
    private Map<String, PublicKey> keys = Map.of();
    private long keysExpireAt;

    public AppleIdTokenService(AppleProperties properties) {
        this.properties = properties;
        this.restClient = RestClient.create();
    }

    @Override
    public AppleProfile verify(String identityToken, String rawNonce) {
        if (!properties.enabled()) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "Sign in with Apple is not configured");
        }
        String kid = kid(identityToken);
        Claims claims = parse(identityToken, keyFor(kid, false));
        if (claims == null) {
            claims = parse(identityToken, keyFor(kid, true));
        }
        if (claims == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Invalid Apple sign-in");
        }
        if (!audienceAllowed(claims.getAudience(), properties.audiences())) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Invalid Apple sign-in");
        }
        requireNonce(
                rawNonce,
                nonceClaim(claims),
                webNonceRequired(claims.getAudience(), properties.audience(), properties.webAudience()));
        String subject = claims.getSubject();
        if (subject == null || subject.isBlank()) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Invalid Apple sign-in");
        }
        String email = claims.get("email", String.class);
        if (email != null) {
            email = email.trim();
            if (email.isEmpty()) {
                email = null;
            }
        }
        return new AppleProfile(subject, email);
    }

    static boolean audienceAllowed(Set<String> tokenAudiences, Set<String> allowed) {
        if (tokenAudiences == null || tokenAudiences.isEmpty() || allowed == null || allowed.isEmpty()) {
            return false;
        }
        for (String audience : tokenAudiences) {
            if (audience != null && allowed.contains(audience)) {
                return true;
            }
        }
        return false;
    }

    static boolean webNonceRequired(Set<String> tokenAudiences, String nativeAudience, String webAudience) {
        if (webAudience == null || webAudience.isBlank() || tokenAudiences == null) {
            return false;
        }
        String web = webAudience.trim();
        if (nativeAudience != null && web.equals(nativeAudience.trim())) {
            return false;
        }
        return tokenAudiences.contains(web);
    }

    static void requireNonce(String rawNonce, String nonceClaim, boolean webToken) {
        boolean present = nonceClaim != null && !nonceClaim.isBlank();
        if (!present) {
            if (webToken) {
                throw new ApiException(HttpStatus.UNAUTHORIZED, "Invalid Apple sign-in");
            }
            return;
        }
        if (!AppleNonce.matches(rawNonce, nonceClaim)) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Invalid Apple sign-in");
        }
    }

    private static String nonceClaim(Claims claims) {
        Object value = claims.get("nonce");
        if (value == null) {
            return null;
        }
        if (value instanceof String text) {
            return text;
        }
        throw new ApiException(HttpStatus.UNAUTHORIZED, "Invalid Apple sign-in");
    }

    private Claims parse(String identityToken, PublicKey key) {
        if (key == null) {
            return null;
        }
        try {
            return Jwts.parser()
                    .verifyWith(key)
                    .requireIssuer(ISSUER)
                    .clockSkewSeconds(60)
                    .build()
                    .parseSignedClaims(identityToken)
                    .getPayload();
        } catch (JwtException | IllegalArgumentException ex) {
            return null;
        }
    }

    private PublicKey keyFor(String kid, boolean force) {
        PublicKey key = refreshKeys(force).get(kid);
        if (key != null || force) {
            return key;
        }
        key = refreshKeys(true).get(kid);
        if (key == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Invalid Apple sign-in");
        }
        return key;
    }

    private Map<String, PublicKey> refreshKeys(boolean force) {
        synchronized (lock) {
            if (!force && !keys.isEmpty() && System.currentTimeMillis() < keysExpireAt) {
                return keys;
            }
            String body = restClient.get()
                    .uri(KEYS_URL)
                    .accept(MediaType.APPLICATION_JSON)
                    .retrieve()
                    .body(String.class);
            JsonObject json = JsonParser.parseString(body == null ? "{}" : body).getAsJsonObject();
            JsonArray list = json.has("keys") && json.get("keys").isJsonArray()
                    ? json.getAsJsonArray("keys")
                    : new JsonArray();
            Map<String, PublicKey> next = new HashMap<>();
            for (JsonElement element : list) {
                if (!element.isJsonObject()) {
                    continue;
                }
                JsonObject jwk = element.getAsJsonObject();
                String kid = text(jwk, "kid");
                if (kid.isEmpty()) {
                    continue;
                }
                next.put(kid, rsaKey(text(jwk, "n"), text(jwk, "e")));
            }
            keys = Map.copyOf(next);
            keysExpireAt = System.currentTimeMillis() + Duration.ofHours(24).toMillis();
            return keys;
        }
    }

    private static String kid(String identityToken) {
        String[] parts = identityToken.split("\\.");
        if (parts.length != 3) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Invalid Apple sign-in");
        }
        try {
            String headerJson = new String(Base64.getUrlDecoder().decode(parts[0]));
            JsonObject header = JsonParser.parseString(headerJson).getAsJsonObject();
            String kid = text(header, "kid");
            if (kid.isEmpty()) {
                throw new ApiException(HttpStatus.UNAUTHORIZED, "Invalid Apple sign-in");
            }
            return kid;
        } catch (RuntimeException ex) {
            if (ex instanceof ApiException api) {
                throw api;
            }
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Invalid Apple sign-in");
        }
    }

    private static PublicKey rsaKey(String modulus, String exponent) {
        try {
            byte[] n = Base64.getUrlDecoder().decode(modulus);
            byte[] e = Base64.getUrlDecoder().decode(exponent);
            RSAPublicKeySpec spec = new RSAPublicKeySpec(new BigInteger(1, n), new BigInteger(1, e));
            return KeyFactory.getInstance("RSA").generatePublic(spec);
        } catch (Exception ex) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Invalid Apple sign-in");
        }
    }

    private static String text(JsonObject object, String key) {
        if (!object.has(key) || object.get(key).isJsonNull()) {
            return "";
        }
        return object.get(key).getAsString().trim();
    }
}
