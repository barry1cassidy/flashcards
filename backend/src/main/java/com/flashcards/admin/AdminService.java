package com.flashcards.admin;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.flashcards.billing.BillingPlan;
import com.flashcards.billing.BillingService;
import com.flashcards.billing.ProAccess;
import com.flashcards.billing.UserSubscription;
import com.flashcards.billing.UserSubscriptionRepository;
import com.flashcards.card.CardRepository;
import com.flashcards.common.ApiException;
import com.flashcards.deck.DeckRepository;
import com.flashcards.group.DeckGroupRepository;
import com.flashcards.security.AdminAccess;
import com.flashcards.security.SubscriptionAccess;
import com.flashcards.user.User;
import com.flashcards.user.UserRepository;

@Service
public class AdminService {

    private final UserRepository userRepository;
    private final UserSubscriptionRepository subscriptionRepository;
    private final DeckGroupRepository groupRepository;
    private final DeckRepository deckRepository;
    private final CardRepository cardRepository;
    private final BillingService billingService;

    public AdminService(
            UserRepository userRepository,
            UserSubscriptionRepository subscriptionRepository,
            DeckGroupRepository groupRepository,
            DeckRepository deckRepository,
            CardRepository cardRepository,
            BillingService billingService) {
        this.userRepository = userRepository;
        this.subscriptionRepository = subscriptionRepository;
        this.groupRepository = groupRepository;
        this.deckRepository = deckRepository;
        this.cardRepository = cardRepository;
        this.billingService = billingService;
    }

    @Transactional(readOnly = true)
    public AdminUsersPageResponse listUsers(UUID actorId, String query, boolean proOnly) {
        requireAdmin(actorId);
        List<User> allUsers = userRepository.findAllByOrderByCreatedAtDesc();
        int totalUsers = allUsers.size();
        int totalPro = 0;
        for (User user : allUsers) {
            if (ProAccess.allowed(user)) {
                totalPro++;
            }
        }

        String needle = sanitizeQuery(query);
        List<User> users = needle.isEmpty()
                ? allUsers
                : userRepository.findByEmailContainingIgnoreCaseOrDisplayNameContainingIgnoreCaseOrderByCreatedAtDesc(
                        needle, needle);
        Map<UUID, List<UserSubscription>> byUser = subscriptionsByUser();
        Map<UUID, ContentCounts> contentByUser = contentCountsByUser();
        List<AdminUserResponse> rows = new ArrayList<>();
        for (User user : users) {
            AdminUserResponse row = toResponse(
                    user,
                    byUser.getOrDefault(user.getId(), List.of()),
                    contentByUser.getOrDefault(user.getId(), ContentCounts.EMPTY));
            if (proOnly && !row.proActive()) {
                continue;
            }
            rows.add(row);
        }
        return new AdminUsersPageResponse(rows, totalUsers, totalPro);
    }

    @Transactional(readOnly = true)
    public AdminUserResponse getUser(UUID actorId, UUID userId) {
        User actor = requireActor(actorId);
        SubscriptionAccess.requireOwnerOrAdmin(actor, userId);
        User user = userId.equals(actor.getId())
                ? actor
                : userRepository
                        .findById(userId)
                        .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));
        List<UserSubscription> subscriptions = new ArrayList<>(subscriptionRepository.findByUser_Id(user.getId()));
        subscriptions.sort(Comparator.comparing(UserSubscription::getUpdatedAt).reversed());
        return toResponse(user, subscriptions, contentCountsForUser(user.getId()));
    }

    @Transactional
    public AdminUserResponse grantSubscription(UUID actorId, UUID userId, BillingPlan plan) {
        requireAdmin(actorId);
        billingService.grantAdminSubscription(userId, plan);
        return getUser(actorId, userId);
    }

    @Transactional
    public AdminUserResponse cancelSubscription(UUID actorId, UUID userId) {
        requireAdmin(actorId);
        billingService.cancelAdminSubscription(userId);
        return getUser(actorId, userId);
    }

    @Transactional
    public void deleteUser(UUID actorId, UUID userId) {
        requireAdmin(actorId);
        if (actorId.equals(userId)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Cannot delete your own account");
        }
        User user = userRepository
                .findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));
        if (user.isAdmin()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Cannot delete an admin account");
        }
        userRepository.delete(user);
    }

    private Map<UUID, List<UserSubscription>> subscriptionsByUser() {
        Map<UUID, List<UserSubscription>> byUser = new LinkedHashMap<>();
        for (UserSubscription subscription : subscriptionRepository.findAll()) {
            UUID userId = subscription.getUser().getId();
            byUser.computeIfAbsent(userId, key -> new ArrayList<>()).add(subscription);
        }
        for (List<UserSubscription> subscriptions : byUser.values()) {
            subscriptions.sort(Comparator.comparing(UserSubscription::getUpdatedAt).reversed());
        }
        return byUser;
    }

    private Map<UUID, ContentCounts> contentCountsByUser() {
        Map<UUID, ContentCounts> counts = new HashMap<>();
        for (Object[] row : groupRepository.countGroupedByUser()) {
            UUID userId = (UUID) row[0];
            int sets = ((Number) row[1]).intValue();
            counts.put(userId, new ContentCounts(sets, 0, 0));
        }
        for (Object[] row : deckRepository.countGroupedByUser()) {
            UUID userId = (UUID) row[0];
            int decks = ((Number) row[1]).intValue();
            ContentCounts current = counts.getOrDefault(userId, ContentCounts.EMPTY);
            counts.put(userId, new ContentCounts(current.setCount(), decks, current.cardCount()));
        }
        for (Object[] row : cardRepository.countGroupedByUser()) {
            UUID userId = (UUID) row[0];
            int cards = ((Number) row[1]).intValue();
            ContentCounts current = counts.getOrDefault(userId, ContentCounts.EMPTY);
            counts.put(userId, new ContentCounts(current.setCount(), current.deckCount(), cards));
        }
        return counts;
    }

    private ContentCounts contentCountsForUser(UUID userId) {
        return new ContentCounts(
                (int) groupRepository.countByUser_Id(userId),
                (int) deckRepository.countByUser_Id(userId),
                (int) cardRepository.countByUserId(userId));
    }

    private AdminUserResponse toResponse(
            User user, List<UserSubscription> subscriptions, ContentCounts content) {
        List<AdminSubscriptionResponse> views = subscriptions.stream().map(AdminService::toSubscription).toList();
        int included = Math.max(0, user.getAgentIncludedCredits());
        int addon = Math.max(0, user.getAgentAddonCredits());
        return new AdminUserResponse(
                user.getId(),
                user.getEmail(),
                user.getDisplayName(),
                user.getCreatedAt(),
                signIn(user),
                user.isAdmin(),
                user.isTeacherMode(),
                user.isProLicensed(),
                ProAccess.allowed(user),
                user.getProExpiresAt(),
                user.getStripeCustomerId(),
                included,
                addon,
                included + addon,
                user.getAgentCreditPeriod(),
                content.setCount(),
                content.deckCount(),
                content.cardCount(),
                views);
    }

    private static AdminSubscriptionResponse toSubscription(UserSubscription subscription) {
        return new AdminSubscriptionResponse(
                subscription.getProvider(),
                subscription.getProviderCustomerId(),
                subscription.getProviderSubscriptionId(),
                subscription.getPlan(),
                subscription.getStatus(),
                subscription.getCurrentPeriodEnd(),
                subscription.isCancelAtPeriodEnd(),
                subscription.getUpdatedAt());
    }

    private static String signIn(User user) {
        return user.getGoogleSub() != null && !user.getGoogleSub().isBlank() ? "GOOGLE" : "PASSWORD";
    }

    private static String sanitizeQuery(String query) {
        if (query == null) {
            return "";
        }
        return query.trim().replace("%", "").replace("_", "").toLowerCase(Locale.ROOT);
    }

    private User requireAdmin(UUID actorId) {
        User actor = requireActor(actorId);
        AdminAccess.require(actor);
        return actor;
    }

    private User requireActor(UUID actorId) {
        return userRepository
                .findById(actorId)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Not authenticated"));
    }

    private record ContentCounts(int setCount, int deckCount, int cardCount) {
        private static final ContentCounts EMPTY = new ContentCounts(0, 0, 0);
    }
}
