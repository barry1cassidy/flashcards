package com.flashcards.share;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.security.SecureRandom;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import com.flashcards.card.Card;
import com.flashcards.card.CardImageService;
import com.flashcards.card.CardRepository;
import com.flashcards.classroom.ClassMemberRepository;
import com.flashcards.classroom.ClassRepository;
import com.flashcards.classroom.JoinCodes;
import com.flashcards.common.ApiException;
import com.flashcards.deck.Deck;
import com.flashcards.deck.DeckRepository;
import com.flashcards.group.DeckGroup;
import com.flashcards.group.DeckGroupRepository;
import com.flashcards.mix.StudyMixRepository;
import com.flashcards.security.OwnedAccess;
import com.flashcards.user.User;
import com.flashcards.user.UserRepository;

@ExtendWith(MockitoExtension.class)
class ShareServiceTest {

    @Mock
    private ContentShareRepository shareRepository;
    @Mock
    private DeckRepository deckRepository;
    @Mock
    private DeckGroupRepository groupRepository;
    @Mock
    private CardRepository cardRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private CardImageService cardImageService;
    @Mock
    private StudyMixRepository mixRepository;
    @Mock
    private ClassRepository classRepository;
    @Mock
    private ClassMemberRepository memberRepository;

    private ShareService shareService;

    private final UUID ownerId = UUID.fromString("00000000-0000-0000-0000-000000000001");
    private final UUID recipientId = UUID.fromString("00000000-0000-0000-0000-000000000002");
    private final UUID deckId = UUID.fromString("00000000-0000-0000-0000-0000000000aa");
    private final UUID groupId = UUID.fromString("00000000-0000-0000-0000-0000000000bb");
    private final UUID shareId = UUID.fromString("00000000-0000-0000-0000-0000000000cc");
    private final UUID copyId = UUID.fromString("00000000-0000-0000-0000-0000000000dd");
    private final UUID cardId = UUID.fromString("00000000-0000-0000-0000-0000000000e1");

    private User owner;
    private User recipient;
    private Deck deck;
    private DeckGroup group;

    @BeforeEach
    void setUp() {
        OwnedAccess ownedAccess = new OwnedAccess(
                deckRepository, groupRepository, cardRepository, mixRepository, classRepository, memberRepository);
        shareService = new ShareService(
                shareRepository,
                deckRepository,
                groupRepository,
                cardRepository,
                userRepository,
                ownedAccess,
                cardImageService,
                new SecureRandom());
        owner = user(ownerId, "Sam", "sam@zipdeck.app");
        recipient = user(recipientId, "Riley", "riley@zipdeck.app");
        deck = deck(deckId, owner, "Spanish Verbs", null);
        group = group(groupId, owner, "Spanish 1");
    }

    @Test
    void createDeckShareMintsCode() {
        when(deckRepository.findByIdAndUserId(deckId, ownerId)).thenReturn(Optional.of(deck));
        when(shareRepository.findByDeck_Id(deckId)).thenReturn(Optional.empty());
        when(shareRepository.existsByCode(any())).thenReturn(false);
        when(shareRepository.save(any(ContentShare.class))).thenAnswer(invocation -> {
            ContentShare saved = invocation.getArgument(0);
            saved.setId(shareId);
            return saved;
        });

        ShareLinkResponse response = shareService.createDeckShare(ownerId, deckId);

        assertEquals(ShareKind.DECK, response.kind());
        assertTrue(JoinCodes.isWellFormed(response.code()));
        ArgumentCaptor<ContentShare> saved = ArgumentCaptor.forClass(ContentShare.class);
        verify(shareRepository).save(saved.capture());
        assertEquals(deck, saved.getValue().getDeck());
        assertEquals(owner, saved.getValue().getOwner());
    }

    @Test
    void createDeckShareReturnsExisting() {
        ContentShare share = deckShare("K7M2QX");
        when(deckRepository.findByIdAndUserId(deckId, ownerId)).thenReturn(Optional.of(deck));
        when(shareRepository.findByDeck_Id(deckId)).thenReturn(Optional.of(share));

        ShareLinkResponse response = shareService.createDeckShare(ownerId, deckId);

        assertEquals("K7M2QX", response.code());
        verify(shareRepository, never()).save(any());
    }

    @Test
    void previewIsPublicAndHidesMissingCodes() {
        ContentShare share = deckShare("K7M2QX");
        when(shareRepository.findByCodeWithTarget("K7M2QX")).thenReturn(Optional.of(share));
        when(cardRepository.countByDeckId(deckId)).thenReturn(12);

        SharePreviewResponse preview = shareService.preview("k7m2qx", null);

        assertEquals("Spanish Verbs", preview.name());
        assertEquals("Sam", preview.ownerName());
        assertEquals(1, preview.deckCount());
        assertEquals(12, preview.cardCount());
        assertFalse(preview.ownShare());
        assertNull(preview.existingDeckId());

        ApiException missing = assertThrows(ApiException.class, () -> shareService.preview("ZZZZZZ", null));
        assertEquals(HttpStatus.NOT_FOUND, missing.getStatus());
        assertEquals("Share not found", missing.getMessage());
    }

    @Test
    void acceptCopiesDeckAndImagesOnce() {
        ContentShare share = deckShare("K7M2QX");
        Card source = card(deck, cardId, "hablar", "to speak", 0);
        when(shareRepository.findByCodeWithTarget("K7M2QX")).thenReturn(Optional.of(share));
        when(deckRepository.findByUser_IdAndSourceShareId(recipientId, shareId)).thenReturn(Optional.empty());
        when(userRepository.findById(recipientId)).thenReturn(Optional.of(recipient));
        when(deckRepository.existsByUser_IdAndNameIgnoreCase(recipientId, "Spanish Verbs")).thenReturn(false);
        when(deckRepository.save(any(Deck.class))).thenAnswer(invocation -> {
            Deck saved = invocation.getArgument(0);
            saved.setId(copyId);
            return saved;
        });
        when(cardRepository.findByDeckIdOrderByPositionAscIdAsc(deckId)).thenReturn(List.of(source));
        when(cardRepository.saveAll(any())).thenAnswer(invocation -> invocation.getArgument(0));

        ShareAcceptResponse first = shareService.accept(recipientId, "k7m2qx");

        assertEquals(copyId, first.deckId());
        assertNull(first.groupId());
        ArgumentCaptor<Deck> savedDeck = ArgumentCaptor.forClass(Deck.class);
        verify(deckRepository).save(savedDeck.capture());
        assertEquals(shareId, savedDeck.getValue().getSourceShareId());
        assertNull(savedDeck.getValue().getGroup());
        verify(cardImageService).copyFrom(eq(source), any(Card.class));

        when(deckRepository.findByUser_IdAndSourceShareId(recipientId, shareId))
                .thenReturn(Optional.of(deck(copyId, recipient, "Spanish Verbs", shareId)));
        ShareAcceptResponse second = shareService.accept(recipientId, "K7M2QX");
        assertEquals(copyId, second.deckId());
    }

    @Test
    void ownerAcceptOpensOriginal() {
        ContentShare share = deckShare("K7M2QX");
        when(shareRepository.findByCodeWithTarget("K7M2QX")).thenReturn(Optional.of(share));

        ShareAcceptResponse response = shareService.accept(ownerId, "K7M2QX");

        assertEquals(deckId, response.deckId());
        verify(deckRepository, never()).save(any());
        verify(cardImageService, never()).copyFrom(any(), any());
    }

    @Test
    void acceptCopiesSetAsIndependentGroup() {
        ContentShare share = setShare("N3P4QR");
        Deck sourceDeck = deck(deckId, owner, "Greetings", null);
        sourceDeck.setGroup(group);
        when(shareRepository.findByCodeWithTarget("N3P4QR")).thenReturn(Optional.of(share));
        when(groupRepository.findByUser_IdAndSourceShareId(recipientId, shareId)).thenReturn(Optional.empty());
        when(userRepository.findById(recipientId)).thenReturn(Optional.of(recipient));
        when(groupRepository.existsByUser_IdAndNameIgnoreCase(recipientId, "Spanish 1")).thenReturn(false);
        when(groupRepository.save(any(DeckGroup.class))).thenAnswer(invocation -> {
            DeckGroup saved = invocation.getArgument(0);
            saved.setId(copyId);
            return saved;
        });
        when(deckRepository.findByGroupIdAndUserId(groupId, ownerId)).thenReturn(List.of(sourceDeck));
        when(deckRepository.existsByUser_IdAndNameIgnoreCase(recipientId, "Greetings")).thenReturn(false);
        when(deckRepository.save(any(Deck.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(cardRepository.findByDeckIdOrderByPositionAscIdAsc(deckId)).thenReturn(List.of());

        ShareAcceptResponse response = shareService.accept(recipientId, "n3p4qr");

        assertEquals(ShareKind.SET, response.kind());
        assertEquals(copyId, response.groupId());
        assertNull(response.deckId());
        ArgumentCaptor<DeckGroup> savedGroup = ArgumentCaptor.forClass(DeckGroup.class);
        verify(groupRepository).save(savedGroup.capture());
        assertEquals(shareId, savedGroup.getValue().getSourceShareId());
        ArgumentCaptor<Deck> savedDeck = ArgumentCaptor.forClass(Deck.class);
        verify(deckRepository).save(savedDeck.capture());
        assertEquals(copyId, savedDeck.getValue().getGroup().getId());
        assertNull(savedDeck.getValue().getSourceShareId());
    }

    @Test
    void revokeStopsPreview() {
        ContentShare share = deckShare("K7M2QX");
        when(deckRepository.findByIdAndUserId(deckId, ownerId)).thenReturn(Optional.of(deck));
        when(shareRepository.findByDeck_Id(deckId)).thenReturn(Optional.of(share));

        shareService.revokeDeckShare(ownerId, deckId);

        verify(shareRepository).delete(share);
        when(shareRepository.findByCodeWithTarget("K7M2QX")).thenReturn(Optional.empty());
        ApiException ex = assertThrows(ApiException.class, () -> shareService.preview("K7M2QX", recipientId));
        assertEquals("Share not found", ex.getMessage());
    }

    @Test
    void uniqueDeckNameWhenTaken() {
        ContentShare share = deckShare("K7M2QX");
        when(shareRepository.findByCodeWithTarget("K7M2QX")).thenReturn(Optional.of(share));
        when(deckRepository.findByUser_IdAndSourceShareId(recipientId, shareId)).thenReturn(Optional.empty());
        when(userRepository.findById(recipientId)).thenReturn(Optional.of(recipient));
        when(deckRepository.existsByUser_IdAndNameIgnoreCase(recipientId, "Spanish Verbs")).thenReturn(true);
        when(deckRepository.existsByUser_IdAndNameIgnoreCase(recipientId, "Spanish Verbs (copy 1)")).thenReturn(false);
        when(deckRepository.save(any(Deck.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(cardRepository.findByDeckIdOrderByPositionAscIdAsc(deckId)).thenReturn(List.of());

        shareService.accept(recipientId, "K7M2QX");

        ArgumentCaptor<Deck> saved = ArgumentCaptor.forClass(Deck.class);
        verify(deckRepository).save(saved.capture());
        assertEquals("Spanish Verbs (copy 1)", saved.getValue().getName());
    }

    private ContentShare deckShare(String code) {
        ContentShare share = new ContentShare();
        share.setId(shareId);
        share.setOwner(owner);
        share.setKind(ShareKind.DECK);
        share.setDeck(deck);
        share.setCode(code);
        return share;
    }

    private ContentShare setShare(String code) {
        ContentShare share = new ContentShare();
        share.setId(shareId);
        share.setOwner(owner);
        share.setKind(ShareKind.SET);
        share.setGroup(group);
        share.setCode(code);
        return share;
    }

    private static Deck deck(UUID id, User user, String name, UUID sourceShareId) {
        Deck created = new Deck();
        created.setId(id);
        created.setUser(user);
        created.setName(name);
        created.setFrontLanguage("es");
        created.setBackLanguage("en");
        created.setSourceShareId(sourceShareId);
        return created;
    }

    private static DeckGroup group(UUID id, User user, String name) {
        DeckGroup created = new DeckGroup();
        created.setId(id);
        created.setUser(user);
        created.setName(name);
        created.setColor("#4C6FFF");
        return created;
    }

    private static Card card(Deck deck, UUID id, String front, String back, int position) {
        Card created = new Card();
        created.setId(id);
        created.setDeck(deck);
        created.setFront(front);
        created.setBack(back);
        created.setPosition(position);
        return created;
    }

    private static User user(UUID id, String name, String email) {
        User created = new User();
        created.setId(id);
        created.setDisplayName(name);
        created.setEmail(email);
        return created;
    }
}
