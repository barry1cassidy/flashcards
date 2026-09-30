package com.flashcards.billing;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import com.flashcards.common.ApiException;
import com.flashcards.user.User;
import com.flashcards.user.UserRepository;

@Service
public class ExpiredStoreSubscriptionRefresh {

    private static final Logger log = LoggerFactory.getLogger(ExpiredStoreSubscriptionRefresh.class);
    private static final Duration RECHECK_GAP = Duration.ofMinutes(2);

    private final BillingProperties properties;
    private final UserRepository userRepository;
    private final UserSubscriptionRepository subscriptionRepository;
    private final PlayBillingGateway playBillingGateway;
    private final BillingService billingService;

    public ExpiredStoreSubscriptionRefresh(
            BillingProperties properties,
            UserRepository userRepository,
            UserSubscriptionRepository subscriptionRepository,
            PlayBillingGateway playBillingGateway,
            BillingService billingService) {
        this.properties = properties;
        this.userRepository = userRepository;
        this.subscriptionRepository = subscriptionRepository;
        this.playBillingGateway = playBillingGateway;
        this.billingService = billingService;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void refresh(UUID userId) {
        if (userId == null || !playBillingGateway.enabled()) {
            return;
        }
        Instant now = Instant.now();
        List<UserSubscription> rows = subscriptionRepository.findByUser_Id(userId);
        if (rows.isEmpty()) {
            return;
        }
        if (rows.stream().anyMatch(row -> row.grantsAccess(now))) {
            userRepository.findById(userId).ifPresent(user -> {
                if (!ProAccess.allowed(user)) {
                    billingService.syncEntitlement(userId);
                }
            });
            return;
        }
        for (UserSubscription row : rows) {
            if (!expiredGoogleSubscription(row, now) || checkedRecently(row, now)) {
                continue;
            }
            refreshGoogle(row);
        }
    }

    private void refreshGoogle(UserSubscription row) {
        User user = row.getUser();
        String productId = googleProductId(row.getPlan());
        String token = row.getProviderSubscriptionId();
        if (user == null || productId == null || token == null || token.isBlank()) {
            return;
        }
        try {
            PlayPurchaseRecord record = playBillingGateway.verifySubscription(productId, token);
            billingService.applyGoogleSubscription(user, record, row.getPlan(), record.orderId());
        } catch (ApiException ex) {
            log.warn("Play subscription refresh failed: {}", ex.getStatus());
        }
    }

    private static boolean expiredGoogleSubscription(UserSubscription row, Instant now) {
        return row.getProvider() == BillingProvider.GOOGLE
                && row.getPlan() != BillingPlan.ADDON
                && row.getCurrentPeriodEnd() != null
                && row.getCurrentPeriodEnd().isBefore(now);
    }

    private static boolean checkedRecently(UserSubscription row, Instant now) {
        return row.getUpdatedAt() != null && row.getUpdatedAt().isAfter(now.minus(RECHECK_GAP));
    }

    private String googleProductId(BillingPlan plan) {
        BillingProperties.Google google = properties.google();
        if (google == null) {
            return null;
        }
        return switch (plan) {
            case YEARLY -> google.productYearly();
            case MONTHLY -> google.productMonthly();
            default -> null;
        };
    }
}
