package com.flashcards.share;

import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.flashcards.card.Card;
import com.flashcards.card.CardImageService;
import com.flashcards.card.CardRepository;
import com.flashcards.classroom.JoinCodes;
import com.flashcards.common.ApiException;
import com.flashcards.common.CopyNames;
import com.flashcards.deck.Deck;
import com.flashcards.deck.DeckRepository;
import com.flashcards.group.DeckGroup;
import com.flashcards.group.DeckGroupRepository;
import com.flashcards.security.OwnedAccess;
import com.flashcards.user.User;
import com.flashcards.user.UserRepository;

@Service
public class ShareService {

    private final ContentShareRepository shareRepository;
    private final DeckRepository deckRepository;
    private final DeckGroupRepository groupRepository;
    private final CardRepository cardRepository;
    private final UserRepository userRepository;
    private final OwnedAccess ownedAccess;
    private final CardImageService cardImageService;
    private final SecureRandom random;

    @Autowired
    public ShareService(
            ContentShareRepository shareRepository,
            DeckRepository deckRepository,
            DeckGroupRepository groupRepository,
            CardRepository cardRepository,
            UserRepository userRepository,
            OwnedAccess ownedAccess,
            CardImageService cardImageService) {
        this(
                shareRepository,
                deckRepository,
                groupRepository,
                cardRepository,
                userRepository,
                ownedAccess,
                cardImageService,
                new SecureRandom());
    }

    ShareService(
            ContentShareRepository shareRepository,
            DeckRepository deckRepository,
            DeckGroupRepository groupRepository,
            CardRepository cardRepository,
            UserRepository userRepository,
            OwnedAccess ownedAccess,
            CardImageService cardImageService,
            SecureRandom random) {
        this.shareRepository = shareRepository;
        this.deckRepository = deckRepository;
        this.groupRepository = groupRepository;
        this.cardRepository = cardRepository;
        this.userRepository = userRepository;
        this.ownedAccess = ownedAccess;
        this.cardImageService = cardImageService;
        this.random = random;
    }

    @Transactional(readOnly = true)
    public ShareLinkResponse deckLink(UUID userId, UUID deckId) {
        ownedAccess.requireDeck(userId, deckId);
        return shareRepository
                .findByDeck_Id(deckId)
                .map(share -> new ShareLinkResponse(ShareKind.DECK, share.getCode()))
                .orElseGet(() -> new ShareLinkResponse(ShareKind.DECK, null));
    }

    @Transactional
    public ShareLinkResponse createDeckShare(UUID userId, UUID deckId) {
        Deck deck = ownedAccess.requireDeck(userId, deckId);
        return shareRepository
                .findByDeck_Id(deckId)
                .map(share -> new ShareLinkResponse(ShareKind.DECK, share.getCode()))
                .orElseGet(() -> {
                    ContentShare share = new ContentShare();
                    share.setOwner(deck.getUser());
                    share.setKind(ShareKind.DECK);
                    share.setDeck(deck);
                    share.setCode(newShareCode());
                    shareRepository.save(share);
                    return new ShareLinkResponse(ShareKind.DECK, share.getCode());
                });
    }

    @Transactional
    public void revokeDeckShare(UUID userId, UUID deckId) {
        ownedAccess.requireDeck(userId, deckId);
        shareRepository.findByDeck_Id(deckId).ifPresent(shareRepository::delete);
    }

    @Transactional(readOnly = true)
    public ShareLinkResponse setLink(UUID userId, UUID groupId) {
        ownedAccess.requireSet(userId, groupId);
        return shareRepository
                .findByGroup_Id(groupId)
                .map(share -> new ShareLinkResponse(ShareKind.SET, share.getCode()))
                .orElseGet(() -> new ShareLinkResponse(ShareKind.SET, null));
    }

    @Transactional
    public ShareLinkResponse createSetShare(UUID userId, UUID groupId) {
        DeckGroup group = ownedAccess.requireSet(userId, groupId);
        return shareRepository
                .findByGroup_Id(groupId)
                .map(share -> new ShareLinkResponse(ShareKind.SET, share.getCode()))
                .orElseGet(() -> {
                    ContentShare share = new ContentShare();
                    share.setOwner(group.getUser());
                    share.setKind(ShareKind.SET);
                    share.setGroup(group);
                    share.setCode(newShareCode());
                    shareRepository.save(share);
                    return new ShareLinkResponse(ShareKind.SET, share.getCode());
                });
    }

    @Transactional
    public void revokeSetShare(UUID userId, UUID groupId) {
        ownedAccess.requireSet(userId, groupId);
        shareRepository.findByGroup_Id(groupId).ifPresent(shareRepository::delete);
    }

    @Transactional(readOnly = true)
    public SharePreviewResponse preview(String rawCode, UUID viewerId) {
        ContentShare share = requireShare(rawCode);
        Counts counts = counts(share);
        boolean ownShare = viewerId != null && viewerId.equals(share.getOwner().getId());
        UUID existingDeckId = null;
        UUID existingGroupId = null;
        if (ownShare) {
            if (share.getKind() == ShareKind.DECK) {
                existingDeckId = share.getDeck().getId();
            } else {
                existingGroupId = share.getGroup().getId();
            }
        } else if (viewerId != null) {
            if (share.getKind() == ShareKind.DECK) {
                existingDeckId = deckRepository
                        .findByUser_IdAndSourceShareId(viewerId, share.getId())
                        .map(Deck::getId)
                        .orElse(null);
            } else {
                existingGroupId = groupRepository
                        .findByUser_IdAndSourceShareId(viewerId, share.getId())
                        .map(DeckGroup::getId)
                        .orElse(null);
            }
        }
        return new SharePreviewResponse(
                share.getKind(),
                share.getCode(),
                targetName(share),
                share.getOwner().getDisplayName(),
                counts.deckCount(),
                counts.cardCount(),
                ownShare,
                existingDeckId,
                existingGroupId);
    }

    @Transactional
    public ShareAcceptResponse accept(UUID userId, String rawCode) {
        ContentShare share = requireShare(rawCode);
        if (userId.equals(share.getOwner().getId())) {
            if (share.getKind() == ShareKind.DECK) {
                return new ShareAcceptResponse(ShareKind.DECK, share.getDeck().getId(), null);
            }
            return new ShareAcceptResponse(ShareKind.SET, null, share.getGroup().getId());
        }
        if (share.getKind() == ShareKind.DECK) {
            Deck existing = deckRepository.findByUser_IdAndSourceShareId(userId, share.getId()).orElse(null);
            if (existing != null) {
                return new ShareAcceptResponse(ShareKind.DECK, existing.getId(), null);
            }
            User user = requireUser(userId);
            Deck copy = copyDeck(user, share.getDeck(), null, share.getId());
            return new ShareAcceptResponse(ShareKind.DECK, copy.getId(), null);
        }
        DeckGroup existing = groupRepository.findByUser_IdAndSourceShareId(userId, share.getId()).orElse(null);
        if (existing != null) {
            return new ShareAcceptResponse(ShareKind.SET, null, existing.getId());
        }
        User user = requireUser(userId);
        DeckGroup source = share.getGroup();
        DeckGroup copy = new DeckGroup();
        copy.setUser(user);
        copy.setName(CopyNames.unique(
                source.getName(),
                CopyNames.SET,
                name -> groupRepository.existsByUser_IdAndNameIgnoreCase(userId, name)));
        copy.setColor(source.getColor());
        copy.setSourceShareId(share.getId());
        groupRepository.save(copy);
        List<Deck> sourceDecks = deckRepository.findByGroupIdAndUserId(source.getId(), share.getOwner().getId());
        for (Deck sourceDeck : sourceDecks) {
            copyDeck(user, sourceDeck, copy, null);
        }
        return new ShareAcceptResponse(ShareKind.SET, null, copy.getId());
    }

    private Deck copyDeck(User user, Deck source, DeckGroup group, UUID sourceShareId) {
        Deck copy = new Deck();
        copy.setUser(user);
        copy.setName(CopyNames.unique(
                source.getName(),
                CopyNames.DECK,
                name -> deckRepository.existsByUser_IdAndNameIgnoreCase(user.getId(), name)));
        copy.setDescription(source.getDescription());
        copy.setGroup(group);
        copy.setFrontLanguage(source.getFrontLanguage());
        copy.setBackLanguage(source.getBackLanguage());
        copy.setSourceShareId(sourceShareId);
        deckRepository.save(copy);
        List<Card> sourceCards = cardRepository.findByDeckIdOrderByPositionAscIdAsc(source.getId());
        List<Card> cards = new ArrayList<>();
        List<Card[]> imageCopies = new ArrayList<>();
        for (Card sourceCard : sourceCards) {
            Card card = new Card();
            card.setDeck(copy);
            card.setFront(sourceCard.getFront());
            card.setBack(sourceCard.getBack());
            card.setHint(sourceCard.getHint());
            card.setPosition(sourceCard.getPosition());
            cards.add(card);
            imageCopies.add(new Card[] {sourceCard, card});
        }
        if (!cards.isEmpty()) {
            cardRepository.saveAll(cards);
        }
        for (Card[] pair : imageCopies) {
            cardImageService.copyFrom(pair[0], pair[1]);
        }
        return copy;
    }

    private ContentShare requireShare(String rawCode) {
        String code = JoinCodes.normalize(rawCode);
        if (!JoinCodes.isWellFormed(code)) {
            throw OwnedAccess.hidden("Share not found");
        }
        ContentShare share = shareRepository
                .findByCodeWithTarget(code)
                .orElseThrow(() -> OwnedAccess.hidden("Share not found"));
        if (share.getKind() == ShareKind.DECK && share.getDeck() == null) {
            throw OwnedAccess.hidden("Share not found");
        }
        if (share.getKind() == ShareKind.SET && share.getGroup() == null) {
            throw OwnedAccess.hidden("Share not found");
        }
        return share;
    }

    private Counts counts(ContentShare share) {
        if (share.getKind() == ShareKind.DECK) {
            return new Counts(1, cardRepository.countByDeckId(share.getDeck().getId()));
        }
        List<Deck> decks = deckRepository.findByGroupIdAndUserId(share.getGroup().getId(), share.getOwner().getId());
        if (decks.isEmpty()) {
            return new Counts(0, 0);
        }
        List<UUID> deckIds = decks.stream().map(Deck::getId).toList();
        return new Counts(decks.size(), cardRepository.countByDeck_IdIn(deckIds));
    }

    private static String targetName(ContentShare share) {
        return share.getKind() == ShareKind.DECK ? share.getDeck().getName() : share.getGroup().getName();
    }

    private String newShareCode() {
        for (int attempt = 0; attempt < 20; attempt++) {
            String code = JoinCodes.random(random);
            if (!shareRepository.existsByCode(code)) {
                return code;
            }
        }
        throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Could not create a share link");
    }

    private User requireUser(UUID userId) {
        return userRepository
                .findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Not authenticated"));
    }

    private record Counts(int deckCount, int cardCount) {
    }
}
