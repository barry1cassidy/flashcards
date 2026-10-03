package com.flashcards.billing;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import com.flashcards.common.ApiException;
import com.flashcards.user.User;
import com.flashcards.user.UserRepository;

@ExtendWith(MockitoExtension.class)
class ExpiredStoreSubscriptionRefreshTest {

    private static final UUID USER_ID = UUID.fromString("00000000-0000-0000-0000-000000000011");

    @Mock
    private UserRepository userRepository;
    @Mock
    private UserSubscriptionRepository subscriptionRepository;
    @Mock
    private PlayBillingGateway playBillingGateway;
    @Mock
    private BillingService billingService;

    private ExpiredStoreSubscriptionRefresh refresh;
    private User user;

    @BeforeEach
    void setUp() {
        BillingProperties properties = new BillingProperties(
                false,
                false,
                "http://localhost:5173",
                "$7.99",
                "$39.99",
                "$2.99",
                null,
                new BillingProperties.Google(
                        "com.zipdeck.app", "google-play.json", "pro_monthly", "pro_yearly", "credits_addon"),
                null,
                "");
        refresh = new ExpiredStoreSubscriptionRefresh(
                properties, userRepository, subscriptionRepository, playBillingGateway, billingService);
        user = new User();
        user.setId(USER_ID);
        lenient().when(userRepository.findById(USER_ID)).thenReturn(java.util.Optional.of(user));
        lenient().when(playBillingGateway.enabled()).thenReturn(true);
    }

    @Test
    void skipsUsersWhoNeverSubscribed() {
        when(subscriptionRepository.findByUser_Id(USER_ID)).thenReturn(List.of());

        refresh.refresh(USER_ID);

        verify(playBillingGateway, never()).verifySubscription(any(), any());
    }

    @Test
    void skipsWhileASubscriptionStillGrantsAccess() {
        user.setProLicensed(true);
        user.setProExpiresAt(Instant.now().plus(5, ChronoUnit.DAYS));
        when(userRepository.findById(USER_ID)).thenReturn(java.util.Optional.of(user));
        when(subscriptionRepository.findByUser_Id(USER_ID)).thenReturn(List.of(googleRow(Instant.now().plus(5, ChronoUnit.DAYS))));

        refresh.refresh(USER_ID);

        verify(playBillingGateway, never()).verifySubscription(any(), any());
        verify(billingService, never()).syncEntitlement(any());
    }

    @Test
    void realignsTheAccountWhenTheSubscriptionRowIsStillActive() {
        user.setProLicensed(true);
        user.setProExpiresAt(Instant.now().minus(1, ChronoUnit.DAYS));
        when(userRepository.findById(USER_ID)).thenReturn(java.util.Optional.of(user));
        when(subscriptionRepository.findByUser_Id(USER_ID)).thenReturn(List.of(googleRow(Instant.now().plus(5, ChronoUnit.DAYS))));

        refresh.refresh(USER_ID);

        verify(playBillingGateway, never()).verifySubscription(any(), any());
        verify(billingService).syncEntitlement(USER_ID);
    }

    @Test
    void skipsAnExpiredStripeSubscription() {
        UserSubscription stripe = googleRow(Instant.now().minus(1, ChronoUnit.DAYS));
        stripe.setProvider(BillingProvider.STRIPE);
        when(subscriptionRepository.findByUser_Id(USER_ID)).thenReturn(List.of(stripe));

        refresh.refresh(USER_ID);

        verify(playBillingGateway, never()).verifySubscription(any(), any());
    }

    @Test
    void persistsAnExpiredAppleSubscriptionSoAddonCreditsStayUsable() {
        user.setProLicensed(true);
        user.setProExpiresAt(Instant.now().minus(1, ChronoUnit.DAYS));
        user.setAgentIncludedCredits(4);
        UserSubscription apple = googleRow(Instant.now().minus(1, ChronoUnit.DAYS));
        apple.setProvider(BillingProvider.APPLE);
        when(subscriptionRepository.findByUser_Id(USER_ID)).thenReturn(List.of(apple));

        refresh.refresh(USER_ID);

        verify(billingService).syncEntitlement(USER_ID);
        verify(playBillingGateway, never()).verifySubscription(any(), any());
    }

    @Test
    void asksPlayWhenAGoogleSubscriptionHasExpired() {
        UserSubscription row = googleRow(Instant.now().minus(1, ChronoUnit.DAYS));
        row.setUpdatedAt(Instant.now().minus(10, ChronoUnit.MINUTES));
        PlayPurchaseRecord record = renewed();
        when(subscriptionRepository.findByUser_Id(USER_ID)).thenReturn(List.of(row));
        when(playBillingGateway.verifySubscription("pro_monthly", "token-1")).thenReturn(record);

        refresh.refresh(USER_ID);

        verify(billingService).applyGoogleSubscription(user, record, BillingPlan.MONTHLY, "order-2");
    }

    @Test
    void waitsBeforeAskingPlayAgain() {
        UserSubscription row = googleRow(Instant.now().minus(1, ChronoUnit.DAYS));
        row.setUpdatedAt(Instant.now().minus(30, ChronoUnit.SECONDS));
        when(subscriptionRepository.findByUser_Id(USER_ID)).thenReturn(List.of(row));

        refresh.refresh(USER_ID);

        verify(playBillingGateway, never()).verifySubscription(any(), any());
    }

    @Test
    void leavesTheAccountUnchangedWhenPlayRefuses() {
        UserSubscription row = googleRow(Instant.now().minus(1, ChronoUnit.DAYS));
        row.setUpdatedAt(Instant.now().minus(10, ChronoUnit.MINUTES));
        when(subscriptionRepository.findByUser_Id(USER_ID)).thenReturn(List.of(row));
        when(playBillingGateway.verifySubscription("pro_monthly", "token-1"))
                .thenThrow(new ApiException(HttpStatus.BAD_GATEWAY, "Payment failed"));

        refresh.refresh(USER_ID);

        verify(billingService, never()).applyGoogleSubscription(any(), any(), any(), any());
    }

    private UserSubscription googleRow(Instant periodEnd) {
        UserSubscription row = new UserSubscription();
        row.setUser(user);
        row.setProvider(BillingProvider.GOOGLE);
        row.setProviderSubscriptionId("token-1");
        row.setPlan(BillingPlan.MONTHLY);
        row.setStatus(SubscriptionStatus.ACTIVE);
        row.setCurrentPeriodEnd(periodEnd);
        row.setUpdatedAt(Instant.now().minus(1, ChronoUnit.HOURS));
        return row;
    }

    private static PlayPurchaseRecord renewed() {
        return new PlayPurchaseRecord(
                "pro_monthly",
                "token-1",
                "order-2",
                null,
                true,
                true,
                true,
                false,
                Instant.now().plus(5, ChronoUnit.MINUTES),
                false);
    }
}
