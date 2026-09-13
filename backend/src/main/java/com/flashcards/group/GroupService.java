package com.flashcards.group;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.flashcards.common.ApiException;
import com.flashcards.deck.DeckResponse;
import com.flashcards.deck.DeckRepository;
import com.flashcards.deck.DeckService;
import com.flashcards.security.OwnedAccess;
import com.flashcards.user.User;
import com.flashcards.user.UserRepository;

@Service
public class GroupService {

    private final DeckGroupRepository deckGroupRepository;
    private final DeckRepository deckRepository;
    private final DeckService deckService;
    private final UserRepository userRepository;
    private final OwnedAccess ownedAccess;

    public GroupService(
            DeckGroupRepository deckGroupRepository,
            DeckRepository deckRepository,
            DeckService deckService,
            UserRepository userRepository,
            OwnedAccess ownedAccess) {
        this.deckGroupRepository = deckGroupRepository;
        this.deckRepository = deckRepository;
        this.deckService = deckService;
        this.userRepository = userRepository;
        this.ownedAccess = ownedAccess;
    }

    @Transactional(readOnly = true)
    public List<GroupResponse> list(UUID userId) {
        return deckGroupRepository.findByUserIdOrderByNameAsc(userId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public GroupDetailResponse get(UUID userId, UUID groupId) {
        DeckGroup group = requireOwned(userId, groupId);
        List<DeckResponse> decks = deckService.listByGroup(userId, groupId);
        return new GroupDetailResponse(toResponse(group), decks);
    }

    @Transactional
    public GroupResponse create(UUID userId, GroupRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Not authenticated"));
        String name = request.name().trim();
        requireUniqueName(userId, name, null);
        DeckGroup group = new DeckGroup();
        group.setUser(user);
        group.setName(name);
        group.setColor(normalizeColor(request.color()));
        deckGroupRepository.save(group);
        return toResponse(group);
    }

    @Transactional
    public GroupResponse update(UUID userId, UUID groupId, GroupRequest request) {
        DeckGroup group = requireOwned(userId, groupId);
        String name = request.name().trim();
        requireUniqueName(userId, name, groupId);
        group.setName(name);
        group.setColor(normalizeColor(request.color()));
        return toResponse(group);
    }

    @Transactional
    public void delete(UUID userId, UUID groupId) {
        DeckGroup group = requireOwned(userId, groupId);
        deckGroupRepository.delete(group);
    }

    @Transactional
    public DeckResponse addDeck(UUID userId, UUID groupId, UUID deckId) {
        requireOwned(userId, groupId);
        return deckService.assignGroup(userId, deckId, groupId);
    }

    @Transactional
    public DeckResponse removeDeck(UUID userId, UUID groupId, UUID deckId) {
        requireOwned(userId, groupId);
        var deck = deckService.requireOwned(userId, deckId);
        if (deck.getGroup() == null || !deck.getGroup().getId().equals(groupId)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "That deck is not in this set");
        }
        return deckService.assignGroup(userId, deckId, null);
    }

    public DeckGroup requireOwned(UUID userId, UUID groupId) {
        return ownedAccess.requireSet(userId, groupId);
    }

    private void requireUniqueName(UUID userId, String name, UUID exceptGroupId) {
        boolean taken = exceptGroupId == null
                ? deckGroupRepository.existsByUser_IdAndNameIgnoreCase(userId, name)
                : deckGroupRepository.existsByUser_IdAndNameIgnoreCaseAndIdNot(userId, name, exceptGroupId);
        if (taken) {
            throw new ApiException(HttpStatus.CONFLICT, "You already have a set with that name");
        }
    }

    private GroupResponse toResponse(DeckGroup group) {
        return new GroupResponse(
                group.getId(),
                group.getName(),
                group.getColor(),
                deckRepository.countByGroupId(group.getId()),
                group.getCreatedAt(),
                group.getUpdatedAt());
    }

    private static String normalizeColor(String color) {
        return color.trim().toUpperCase();
    }
}
