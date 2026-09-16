package com.flashcards.card;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.Locale;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.flashcards.billing.ProAccess;
import com.flashcards.common.ApiException;
import com.flashcards.security.OwnedAccess;
import com.flashcards.user.User;
import com.flashcards.user.UserRepository;

@Service
public class CardImageService {

    private final CardImageStore store;
    private final CardImageProperties properties;
    private final OwnedAccess ownedAccess;
    private final UserRepository userRepository;

    public CardImageService(
            CardImageStore store,
            CardImageProperties properties,
            OwnedAccess ownedAccess,
            UserRepository userRepository) {
        this.store = store;
        this.properties = properties;
        this.ownedAccess = ownedAccess;
        this.userRepository = userRepository;
    }

    @Transactional
    public CardResponse save(UUID userId, UUID cardId, CardImageSide side, MultipartFile file) {
        User user = requireUser(userId);
        ProAccess.require(user);
        Card card = ownedAccess.requireCard(userId, cardId);
        byte[] processed = processUpload(file);
        store.put(key(card.getId(), side), processed);
        setHash(card, side, sha256(processed));
        card.getDeck().setUpdatedAt(java.time.Instant.now());
        return CardService.toResponse(card);
    }

    @Transactional
    public void delete(UUID userId, UUID cardId, CardImageSide side) {
        Card card = ownedAccess.requireCard(userId, cardId);
        deleteSide(card, side);
        card.getDeck().setUpdatedAt(java.time.Instant.now());
    }

    @Transactional(readOnly = true)
    public byte[] load(UUID userId, UUID cardId, CardImageSide side) {
        Card card = ownedAccess.requireCard(userId, cardId);
        if (!hasImage(hash(card, side))) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Card image not found");
        }
        return store.get(key(card.getId(), side))
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Card image not found"));
    }

    public void copyFrom(Card source, Card dest) {
        copySide(source, dest, CardImageSide.FRONT);
        copySide(source, dest, CardImageSide.BACK);
    }

    public void deleteAll(Card card) {
        if (card == null || card.getId() == null) {
            return;
        }
        deleteSide(card, CardImageSide.FRONT);
        deleteSide(card, CardImageSide.BACK);
    }

    private void copySide(Card source, Card dest, CardImageSide side) {
        String sourceHash = hash(source, side);
        if (!hasImage(sourceHash)) {
            deleteSide(dest, side);
            return;
        }
        byte[] bytes = store.get(key(source.getId(), side)).orElse(null);
        if (bytes == null || bytes.length == 0) {
            deleteSide(dest, side);
            return;
        }
        store.put(key(dest.getId(), side), bytes);
        setHash(dest, side, sourceHash);
    }

    private void deleteSide(Card card, CardImageSide side) {
        store.delete(key(card.getId(), side));
        setHash(card, side, null);
    }

    private byte[] processUpload(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Image file is required");
        }
        if (file.getSize() > properties.maxBytes()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Image must be 5 MB or smaller");
        }
        String filename = file.getOriginalFilename() == null ? "" : file.getOriginalFilename();
        String contentType = file.getContentType() == null ? "" : file.getContentType();
        if (!allowedType(filename, contentType)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Upload a JPG, PNG, or GIF image");
        }
        byte[] raw;
        try {
            raw = file.getBytes();
        } catch (java.io.IOException ex) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Could not read image");
        }
        if (raw.length > properties.maxBytes()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Image must be 5 MB or smaller");
        }
        return CardImageProcessor.toJpeg(raw, properties.maxEdge());
    }

    private String key(UUID cardId, CardImageSide side) {
        return properties.prefix() + "/" + cardId + "/" + side.fileName();
    }

    private static boolean allowedType(String filename, String contentType) {
        String name = filename.toLowerCase(Locale.ROOT);
        String type = contentType.toLowerCase(Locale.ROOT);
        boolean byName = name.endsWith(".jpg") || name.endsWith(".jpeg") || name.endsWith(".png") || name.endsWith(".gif");
        boolean byType = type.equals("image/jpeg") || type.equals("image/png") || type.equals("image/gif")
                || type.equals("image/pjpeg");
        return byName || byType;
    }

    private static String hash(Card card, CardImageSide side) {
        return side == CardImageSide.FRONT ? card.getFrontImage() : card.getBackImage();
    }

    private static void setHash(Card card, CardImageSide side, String hash) {
        if (side == CardImageSide.FRONT) {
            card.setFrontImage(hash);
        } else {
            card.setBackImage(hash);
        }
    }

    public static boolean hasImage(String hash) {
        return hash != null && !hash.isBlank();
    }

    static String sha256(byte[] bytes) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(bytes);
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException ex) {
            return HexFormat.of().formatHex(String.valueOf(bytes.length).getBytes(StandardCharsets.UTF_8));
        }
    }

    private User requireUser(UUID userId) {
        return userRepository
                .findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));
    }
}
