package com.flashcards.studio;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import com.flashcards.billing.ExpiredStoreSubscriptionRefresh;
import com.flashcards.common.ApiException;
import com.flashcards.user.User;
import com.flashcards.user.UserRepository;

@ExtendWith(MockitoExtension.class)
class ConversationPlaylistServiceTest {

    private static final UUID USER_ID = UUID.fromString("00000000-0000-0000-0000-000000000041");
    private static final UUID PLAYLIST_ID = UUID.fromString("00000000-0000-0000-0000-000000000042");

    @Mock
    private ConversationPlaylistRepository playlistRepository;
    @Mock
    private ConversationPlaylistItemRepository itemRepository;
    @Mock
    private LanguageConversationRepository conversationRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private ExpiredStoreSubscriptionRefresh expiredStoreSubscriptionRefresh;

    private ConversationPlaylistService playlistService;
    private User user;
    private final List<ConversationPlaylistItem> storedItems = new ArrayList<>();

    @BeforeEach
    void setUp() {
        playlistService = new ConversationPlaylistService(
                playlistRepository,
                itemRepository,
                conversationRepository,
                userRepository,
                expiredStoreSubscriptionRefresh);
        user = new User();
        user.setId(USER_ID);
        user.setProLicensed(true);
        lenient().when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));
        lenient().when(playlistRepository.saveAndFlush(any())).thenAnswer(invocation -> {
            ConversationPlaylist playlist = invocation.getArgument(0);
            if (playlist.getId() == null) {
                playlist.setId(PLAYLIST_ID);
            }
            if (playlist.getCreatedAt() == null) {
                playlist.setCreatedAt(Instant.parse("2026-04-01T00:00:00Z"));
            }
            return playlist;
        });
        lenient().when(itemRepository.findByPlaylist_IdOrderByPositionAsc(PLAYLIST_ID)).thenAnswer(invocation -> List.copyOf(storedItems));
        lenient().when(itemRepository.saveAll(any())).thenAnswer(invocation -> {
            storedItems.clear();
            storedItems.addAll(invocation.getArgument(0));
            return storedItems;
        });
    }

    @Test
    void savesAFixedListInTheChosenOrder() {
        LanguageConversation cafe = scene("00000000-0000-0000-0000-000000000051", "Cafe");
        LanguageConversation hotel = scene("00000000-0000-0000-0000-000000000052", "Hotel");
        when(conversationRepository.findByIdInAndUser_Id(List.of(hotel.getId(), cafe.getId()), USER_ID))
                .thenReturn(List.of(cafe, hotel));

        ConversationPlaylistResponse response = playlistService.create(
                USER_ID,
                new ConversationPlaylistRequest(
                        "Morning",
                        "en-US",
                        "es-ES",
                        false,
                        List.of(hotel.getId(), cafe.getId(), hotel.getId())));

        assertEquals(List.of(hotel.getId(), cafe.getId()), response.conversationIds());
        assertEquals(2, response.conversationCount());
        assertEquals(3, response.turnCount());
        assertEquals(0, storedItems.get(0).getPosition());
        assertEquals(hotel.getId(), storedItems.get(0).getConversation().getId());
        assertEquals(1, storedItems.get(1).getPosition());
        assertEquals(cafe.getId(), storedItems.get(1).getConversation().getId());
    }

    @Test
    void includeAllPlaysConversationsInCreatedOrder() {
        LanguageConversation older = scene("00000000-0000-0000-0000-000000000051", "Cafe");
        LanguageConversation newer = scene("00000000-0000-0000-0000-000000000052", "Hotel");
        when(conversationRepository.countByUser_IdAndNativeLanguageAndTargetLanguage(USER_ID, "en-US", "es-ES"))
                .thenReturn(2L);
        when(conversationRepository.findByUser_IdAndNativeLanguageAndTargetLanguageOrderByCreatedAtAsc(
                        USER_ID, "en-US", "es-ES"))
                .thenReturn(List.of(older, newer));

        ConversationPlaylistResponse created = playlistService.create(
                USER_ID, new ConversationPlaylistRequest("All Spanish", "en-US", "es-ES", true, List.of()));

        assertTrue(created.includeAll());
        assertTrue(created.conversationIds().isEmpty());
        assertEquals(2, created.conversationCount());
        verify(itemRepository, never()).saveAll(any());

        ConversationPlaylist playlist = new ConversationPlaylist();
        playlist.setId(PLAYLIST_ID);
        playlist.setUser(user);
        playlist.setName("All Spanish");
        playlist.setNativeLanguage("en-US");
        playlist.setTargetLanguage("es-ES");
        playlist.setIncludeAll(true);
        when(playlistRepository.findByIdAndUser_Id(PLAYLIST_ID, USER_ID)).thenReturn(Optional.of(playlist));

        ConversationPlaylistListenResponse listen = playlistService.listen(USER_ID, PLAYLIST_ID);

        assertEquals(List.of("Cafe", "Hotel"), listen.conversations().stream().map(LanguageConversationResponse::title).toList());
        assertEquals("A coffee.", listen.conversations().get(0).turns().get(0).nativeText());
    }

    @Test
    void rejectsAConversationFromAnotherPair() {
        LanguageConversation french = scene("00000000-0000-0000-0000-000000000051", "Cafe");
        french.setTargetLanguage("fr-FR");
        when(conversationRepository.findByIdInAndUser_Id(List.of(french.getId()), USER_ID)).thenReturn(List.of(french));

        ApiException error = assertThrows(
                ApiException.class,
                () -> playlistService.create(
                        USER_ID,
                        new ConversationPlaylistRequest("Morning", "en-US", "es-ES", false, List.of(french.getId()))));

        assertEquals(HttpStatus.BAD_REQUEST, error.getStatus());
        assertEquals("That conversation is for a different language pair", error.getMessage());
    }

    @Test
    void rejectsADuplicateName() {
        when(playlistRepository.existsByUser_IdAndNameIgnoreCase(USER_ID, "Morning")).thenReturn(true);

        ApiException error = assertThrows(
                ApiException.class,
                () -> playlistService.create(
                        USER_ID, new ConversationPlaylistRequest("Morning", "en-US", "es-ES", true, List.of())));

        assertEquals(HttpStatus.CONFLICT, error.getStatus());
        assertEquals("You already have a playlist with that name", error.getMessage());
    }

    @Test
    void rejectsALanguageChange() {
        ConversationPlaylist playlist = owned("Morning");
        when(playlistRepository.findByIdAndUser_Id(PLAYLIST_ID, USER_ID)).thenReturn(Optional.of(playlist));

        ApiException error = assertThrows(
                ApiException.class,
                () -> playlistService.update(
                        USER_ID,
                        PLAYLIST_ID,
                        new ConversationPlaylistRequest("Morning", "en-US", "fr-FR", true, List.of())));

        assertEquals(HttpStatus.BAD_REQUEST, error.getStatus());
        assertEquals("A playlist stays on one language pair", error.getMessage());
    }

    @Test
    void requiresPro() {
        user.setProLicensed(false);

        ApiException error = assertThrows(
                ApiException.class, () -> playlistService.list(USER_ID, null, null));

        assertEquals(HttpStatus.FORBIDDEN, error.getStatus());
    }

    private ConversationPlaylist owned(String name) {
        ConversationPlaylist playlist = new ConversationPlaylist();
        playlist.setId(PLAYLIST_ID);
        playlist.setUser(user);
        playlist.setName(name);
        playlist.setNativeLanguage("en-US");
        playlist.setTargetLanguage("es-ES");
        playlist.setCreatedAt(Instant.parse("2026-04-01T00:00:00Z"));
        return playlist;
    }

    private LanguageConversation scene(String id, String title) {
        LanguageConversation conversation = new LanguageConversation();
        conversation.setId(UUID.fromString(id));
        conversation.setUser(user);
        conversation.setTitle(title);
        conversation.setScenario("cafe");
        conversation.setLevel(LanguageLevel.A2);
        conversation.setNativeLanguage("en-US");
        conversation.setTargetLanguage("es-ES");
        conversation.setYourRole("customer");
        conversation.setTheirRole("barista");
        conversation.setStatus(LanguageSceneStatus.LEARNING);
        LanguageTurn turn = new LanguageTurn();
        turn.setRole(LanguageTurnRole.YOU);
        turn.setSpeaker("you");
        turn.setNativeText("A coffee.");
        turn.setTargetText("Un café.");
        conversation.setTurns(id.endsWith("51") ? List.of(turn) : List.of(turn, turn));
        return conversation;
    }
}
