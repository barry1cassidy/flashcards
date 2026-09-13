package com.flashcards.admin;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.flashcards.billing.ProAccess;
import com.flashcards.billing.UserSubscription;
import com.flashcards.billing.UserSubscriptionRepository;
import com.flashcards.common.ApiException;
import com.flashcards.security.AdminAccess;
import com.flashcards.security.SubscriptionAccess;
import com.flashcards.user.User;
import com.flashcards.user.UserRepository;

@Service
public class AdminService {

    private final UserRepository userRepository;
    private final UserSubscriptionRepository subscriptionRepository;

    public AdminService(UserRepository userRepository, UserSubscriptionRepository subscriptionRepository) {
        this.userRepository = userRepository;
        this.subscriptionRepository = subscriptionRepository;
    }

    @Transactional(readOnly = true)
    public List<AdminUserResponse> listUsers(UUID actorId, String query) {
        requireAdmin(actorId);
        String needle = sanitizeQuery(query);
        List<User> users = needle.isEmpty()
                ? userRepository.findAllByOrderByCreatedAtDesc()
                : userRepository.findByEmailContainingIgnoreCaseOrDisplayNameContainingIgnoreCaseOrderByCreatedAtDesc(
                        needle, needle);
        Map<UUID, List<UserSubscription>> byUser = subscriptionsByUser();
        List<AdminUserResponse> rows = new ArrayList<>(users.size());
        for (User user : users) {
            rows.add(toResponse(user, byUser.getOrDefault(user.getId(), List.of())));
        }
        return rows;
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
        return toResponse(user, subscriptions);
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

    private AdminUserResponse toResponse(User user, List<UserSubscription> subscriptions) {
        List<AdminSubscriptionResponse> views = subscriptions.stream().map(AdminService::toSubscription).toList();
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
                user.getAgentIncludedCredits(),
                user.getAgentAddonCredits(),
                user.getAgentCreditPeriod(),
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
}
