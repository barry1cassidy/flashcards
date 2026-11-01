package com.flashcards.studio;

import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.flashcards.billing.ExpiredStoreSubscriptionRefresh;
import com.flashcards.billing.ProAccess;
import com.flashcards.card.CardLanguages;
import com.flashcards.common.ApiException;
import com.flashcards.security.OwnedAccess;
import com.flashcards.user.User;
import com.flashcards.user.UserRepository;

@Service
public class ConversationPlaylistService {

    static final int MAX_CONVERSATIONS = 40;

    private final ConversationPlaylistRepository playlistRepository;
    private final ConversationPlaylistItemRepository itemRepository;
    private final LanguageConversationRepository conversationRepository;
    private final UserRepository userRepository;
    private final ExpiredStoreSubscriptionRefresh expiredStoreSubscriptionRefresh;

    public ConversationPlaylistService(
            ConversationPlaylistRepository playlistRepository,
            ConversationPlaylistItemRepository itemRepository,
            LanguageConversationRepository conversationRepository,
            UserRepository userRepository,
            ExpiredStoreSubscriptionRefresh expiredStoreSubscriptionRefresh) {
        this.playlistRepository = playlistRepository;
        this.itemRepository = itemRepository;
        this.conversationRepository = conversationRepository;
        this.userRepository = userRepository;
        this.expiredStoreSubscriptionRefresh = expiredStoreSubscriptionRefresh;
    }

    @Transactional(readOnly = true)
    public List<ConversationPlaylistResponse> list(UUID userId, String nativeLanguage, String targetLanguage) {
        User user = requireProUser(userId);
        boolean filtered = nativeLanguage != null
                && !nativeLanguage.isBlank()
                && targetLanguage != null
                && !targetLanguage.isBlank();
        List<ConversationPlaylist> rows = filtered
                ? playlistRepository.findByUser_IdAndNativeLanguageAndTargetLanguageOrderByUpdatedAtDesc(
                        user.getId(),
                        CardLanguages.normalize(nativeLanguage, CardLanguages.fromUserLocale(user.getLocale())),
                        CardLanguages.normalize(targetLanguage, CardLanguages.DEFAULT))
                : playlistRepository.findByUser_IdOrderByUpdatedAtDesc(user.getId());
        return rows.stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public ConversationPlaylistResponse get(UUID userId, UUID playlistId) {
        return toResponse(requireOwned(requireProUser(userId).getId(), playlistId));
    }

    @Transactional(readOnly = true)
    public ConversationPlaylistListenResponse listen(UUID userId, UUID playlistId) {
        ConversationPlaylist playlist = requireOwned(requireProUser(userId).getId(), playlistId);
        List<LanguageConversation> conversations = resolve(playlist);
        return new ConversationPlaylistListenResponse(
                playlist.getId(),
                playlist.getName(),
                playlist.getNativeLanguage(),
                playlist.getTargetLanguage(),
                conversations.stream().map(conversation -> LanguageStudioService.toResponse(conversation, true)).toList());
    }

    @Transactional
    public ConversationPlaylistResponse create(UUID userId, ConversationPlaylistRequest request) {
        User user = requireProUser(userId);
        ConversationPlaylist playlist = new ConversationPlaylist();
        playlist.setUser(user);
        apply(playlist, user, request, true);
        return toResponse(playlist);
    }

    @Transactional
    public ConversationPlaylistResponse update(UUID userId, UUID playlistId, ConversationPlaylistRequest request) {
        User user = requireProUser(userId);
        ConversationPlaylist playlist = requireOwned(user.getId(), playlistId);
        apply(playlist, user, request, false);
        return toResponse(playlist);
    }

    @Transactional
    public void delete(UUID userId, UUID playlistId) {
        ConversationPlaylist playlist = requireOwned(requireProUser(userId).getId(), playlistId);
        itemRepository.deleteAll(itemRepository.findByPlaylist_IdOrderByPositionAsc(playlist.getId()));
        playlistRepository.delete(playlist);
    }

    private void apply(ConversationPlaylist playlist, User user, ConversationPlaylistRequest request, boolean creating) {
        String name = request.name() == null ? "" : request.name().trim();
        if (name.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Validation failed");
        }
        requireUniqueName(user.getId(), name, playlist.getId());
        String nativeLanguage = CardLanguages.normalize(request.nativeLanguage(), CardLanguages.fromUserLocale(user.getLocale()));
        String targetLanguage = CardLanguages.normalize(request.targetLanguage(), CardLanguages.DEFAULT);
        if (nativeLanguage.equalsIgnoreCase(targetLanguage)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Choose two different languages");
        }
        if (!creating
                && (!nativeLanguage.equals(playlist.getNativeLanguage())
                        || !targetLanguage.equals(playlist.getTargetLanguage()))) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "A playlist stays on one language pair");
        }
        boolean includeAll = request.includeAll();
        List<LanguageConversation> selected = List.of();
        if (!includeAll) {
            selected = orderedConversations(user.getId(), nativeLanguage, targetLanguage, request.conversationIds());
            if (selected.isEmpty()) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Select at least one conversation");
            }
        } else if (conversationRepository.countByUser_IdAndNativeLanguageAndTargetLanguage(
                        user.getId(), nativeLanguage, targetLanguage)
                == 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Select at least one conversation");
        }
        playlist.setName(name);
        playlist.setNativeLanguage(nativeLanguage);
        playlist.setTargetLanguage(targetLanguage);
        playlist.setIncludeAll(includeAll);
        playlist.setUpdatedAt(Instant.now());
        playlistRepository.saveAndFlush(playlist);
        replaceItems(playlist, includeAll ? List.of() : selected);
    }

    private void replaceItems(ConversationPlaylist playlist, List<LanguageConversation> conversations) {
        itemRepository.deleteAll(itemRepository.findByPlaylist_IdOrderByPositionAsc(playlist.getId()));
        itemRepository.flush();
        if (conversations.isEmpty()) {
            return;
        }
        List<ConversationPlaylistItem> items = new ArrayList<>();
        for (int i = 0; i < conversations.size(); i++) {
            ConversationPlaylistItem item = new ConversationPlaylistItem();
            item.setPlaylist(playlist);
            item.setConversation(conversations.get(i));
            item.setPosition(i);
            items.add(item);
        }
        itemRepository.saveAll(items);
    }

    private List<LanguageConversation> orderedConversations(
            UUID userId, String nativeLanguage, String targetLanguage, List<UUID> conversationIds) {
        List<UUID> ids = distinctIds(conversationIds);
        if (ids.size() > MAX_CONVERSATIONS) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "A playlist can include at most 40 conversations");
        }
        if (ids.isEmpty()) {
            return List.of();
        }
        Map<UUID, LanguageConversation> byId = new LinkedHashMap<>();
        for (LanguageConversation conversation : conversationRepository.findByIdInAndUser_Id(ids, userId)) {
            byId.put(conversation.getId(), conversation);
        }
        List<LanguageConversation> ordered = new ArrayList<>();
        for (UUID id : ids) {
            LanguageConversation conversation = byId.get(id);
            if (conversation == null) {
                throw new ApiException(HttpStatus.NOT_FOUND, "Conversation not found");
            }
            if (!nativeLanguage.equals(conversation.getNativeLanguage())
                    || !targetLanguage.equals(conversation.getTargetLanguage())) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "That conversation is for a different language pair");
            }
            ordered.add(conversation);
        }
        return ordered;
    }

    private ConversationPlaylistResponse toResponse(ConversationPlaylist playlist) {
        List<ConversationPlaylistItem> items = itemRepository.findByPlaylist_IdOrderByPositionAsc(playlist.getId());
        List<LanguageConversation> conversations = resolve(playlist, items);
        int turnCount = 0;
        for (LanguageConversation conversation : conversations) {
            turnCount += conversation.getTurns() == null ? 0 : conversation.getTurns().size();
        }
        List<UUID> ids = playlist.isIncludeAll()
                ? List.of()
                : items.stream().map(item -> item.getConversation().getId()).toList();
        return new ConversationPlaylistResponse(
                playlist.getId(),
                playlist.getName(),
                playlist.isIncludeAll(),
                playlist.getNativeLanguage(),
                playlist.getTargetLanguage(),
                ids,
                conversations.size(),
                turnCount,
                playlist.getCreatedAt(),
                playlist.getUpdatedAt());
    }

    private List<LanguageConversation> resolve(ConversationPlaylist playlist) {
        return resolve(playlist, itemRepository.findByPlaylist_IdOrderByPositionAsc(playlist.getId()));
    }

    private List<LanguageConversation> resolve(ConversationPlaylist playlist, List<ConversationPlaylistItem> items) {
        if (playlist.isIncludeAll()) {
            return conversationRepository.findByUser_IdAndNativeLanguageAndTargetLanguageOrderByCreatedAtAsc(
                    playlist.getUser().getId(), playlist.getNativeLanguage(), playlist.getTargetLanguage());
        }
        List<LanguageConversation> conversations = new ArrayList<>();
        for (ConversationPlaylistItem item : items) {
            if (item.getConversation() != null) {
                conversations.add(item.getConversation());
            }
        }
        return conversations;
    }

    private ConversationPlaylist requireOwned(UUID userId, UUID playlistId) {
        return playlistRepository
                .findByIdAndUser_Id(playlistId, userId)
                .orElseThrow(() -> OwnedAccess.hidden("Playlist not found"));
    }

    private void requireUniqueName(UUID userId, String name, UUID exceptPlaylistId) {
        boolean taken = exceptPlaylistId == null
                ? playlistRepository.existsByUser_IdAndNameIgnoreCase(userId, name)
                : playlistRepository.existsByUser_IdAndNameIgnoreCaseAndIdNot(userId, name, exceptPlaylistId);
        if (taken) {
            throw new ApiException(HttpStatus.CONFLICT, "You already have a playlist with that name");
        }
    }

    private static List<UUID> distinctIds(List<UUID> ids) {
        LinkedHashSet<UUID> unique = new LinkedHashSet<>();
        if (ids != null) {
            for (UUID id : ids) {
                if (id != null) {
                    unique.add(id);
                }
            }
        }
        return List.copyOf(unique);
    }

    private User requireProUser(UUID userId) {
        expiredStoreSubscriptionRefresh.refresh(userId);
        User user = userRepository
                .findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Not authenticated"));
        ProAccess.require(user);
        return user;
    }
}
