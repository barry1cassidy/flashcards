package com.flashcards.billing;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import com.flashcards.agent.AgentCreditService;
import com.flashcards.agent.AgentProperties;
import com.flashcards.agent.CreditBalance;
import com.flashcards.common.ApiException;
import com.flashcards.user.User;
import com.flashcards.user.UserRepository;

@ExtendWith(MockitoExtension.class)
class BillingServiceTest {

    private static final UUID USER_ID = UUID.fromString("00000000-0000-0000-0000-000000000011");

    @Mock
    private StripeGateway stripeGateway;
    @Mock
    private UserRepository userRepository;
    @Mock
    private UserSubscriptionRepository subscriptionRepository;
    @Mock
    private AgentCreditService creditService;
    @Mock
    private PlayBillingGateway playBillingGateway;

    private final List<UserSubscription> rows = new ArrayList<>();
    private BillingService billingService;
    private User user;

    @BeforeEach
    void setUp() {
        BillingProperties properties = new BillingProperties(
                true,
                true,
                "http://localhost:5173",
                "$7.99",
                "$39.99",
                "$2.99",
                new BillingProperties.Stripe("sk_test", "whsec", "price_month", "price_year", "price_addon"),
                googleConfig());
        AgentProperties agentProperties = new AgentProperties("", "", "", 10, 10, 40, 90, 0, 0, 0, 0);
        billingService = new BillingService(
                properties,
                stripeGateway,
                userRepository,
                subscriptionRepository,
                creditService,
                agentProperties,
                playBillingGateway);
        user = new User();
        user.setId(USER_ID);
        user.setEmail("barry@example.com");
        user.setDisplayName("Barry");
        lenient().when(subscriptionRepository.save(any(UserSubscription.class))).thenAnswer(invocation -> {
            UserSubscription row = invocation.getArgument(0);
            if (row.getId() == null) {
                row.setId(UUID.randomUUID());
            }
            rows.removeIf(existing -> existing.getProviderSubscriptionId().equals(row.getProviderSubscriptionId()));
            rows.add(row);
            return row;
        });
        lenient().when(subscriptionRepository.findByUser_Id(USER_ID)).thenAnswer(invocation -> List.copyOf(rows));
        lenient()
                .when(subscriptionRepository.findByProviderAndProviderSubscriptionId(any(), any()))
                .thenAnswer(invocation -> {
                    BillingProvider provider = invocation.getArgument(0);
                    String id = invocation.getArgument(1);
                    return rows.stream()
                            .filter(row -> row.getProvider() == provider && row.getProviderSubscriptionId().equals(id))
                            .findFirst();
                });
        lenient().when(creditService.snapshot(any(User.class))).thenAnswer(invocation -> {
            User current = invocation.getArgument(0);
            return CreditBalance.of(current.getAgentIncludedCredits(), current.getAgentAddonCredits());
        });
        lenient().when(subscriptionRepository.findByUser_IdAndProvider(any(), any())).thenAnswer(invocation -> {
            BillingProvider provider = invocation.getArgument(1);
            return rows.stream().filter(row -> row.getProvider() == provider).toList();
        });
        lenient().when(playBillingGateway.enabled()).thenReturn(false);
        lenient().when(playBillingGateway.addonEnabled()).thenReturn(false);
    }

    private static BillingProperties.Google googleConfig() {
        return new BillingProperties.Google(
                "com.zipdeck.app", "google-play.json", "pro_monthly", "pro_yearly", "credits_addon");
    }

    @Test
    void activeYearlySubscriptionGrantsPro() {
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));
        when(userRepository.save(user)).thenReturn(user);

        billingService.applySnapshot(new StripeSnapshot(
                "cus_1",
                "sub_1",
                "active",
                "price_year",
                Instant.now().plusSeconds(60 * 60 * 24 * 30),
                false,
                Map.of("userId", USER_ID.toString(), "plan", "YEARLY")));

        assertTrue(user.isProLicensed());
        assertEquals(BillingPlan.YEARLY, rows.get(0).getPlan());
        assertEquals(SubscriptionStatus.ACTIVE, rows.get(0).getStatus());
        assertTrue(ProAccess.allowed(user));
    }

    @Test
    void canceledSubscriptionRemovesPro() {
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));
        when(userRepository.save(user)).thenReturn(user);
        Instant end = Instant.now().plusSeconds(60 * 60 * 24);
        billingService.applySnapshot(new StripeSnapshot(
                "cus_1", "sub_1", "active", "price_month", end, false, Map.of("userId", USER_ID.toString())));
        billingService.applySnapshot(new StripeSnapshot(
                "cus_1", "sub_1", "canceled", "price_month", end, false, Map.of("userId", USER_ID.toString())));

        assertFalse(user.isProLicensed());
        assertFalse(ProAccess.allowed(user));
        assertEquals(SubscriptionStatus.CANCELED, rows.get(0).getStatus());
    }

    @Test
    void cancelAtPeriodEndKeepsProUntilExpiry() {
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));
        when(userRepository.save(user)).thenReturn(user);
        Instant end = Instant.now().plusSeconds(60 * 60 * 24 * 10);
        billingService.applySnapshot(new StripeSnapshot(
                "cus_1",
                "sub_1",
                "active",
                "price_month",
                end,
                true,
                Map.of("userId", USER_ID.toString())));

        assertTrue(ProAccess.allowed(user));
        BillingStatusResponse status = billingService.status(USER_ID);
        assertTrue(status.cancelAtPeriodEnd());
        assertEquals(BillingPlan.MONTHLY, status.plan());
    }

    @Test
    void checkoutRejectedWhenStripeSubscriptionIsOpen() {
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));
        when(userRepository.save(user)).thenReturn(user);
        billingService.applySnapshot(new StripeSnapshot(
                "cus_1",
                "sub_1",
                "active",
                "price_month",
                Instant.now().plusSeconds(3600),
                false,
                Map.of("userId", USER_ID.toString())));

        ApiException ex = assertThrows(
                ApiException.class, () -> billingService.createCheckout(USER_ID, BillingPlan.YEARLY, "/settings"));
        assertEquals(HttpStatus.CONFLICT, ex.getStatus());
        assertEquals("Already subscribed", ex.getMessage());
        verify(stripeGateway, never()).createCheckout(any(), any(), any(), any(), any(), any(), anyBoolean());
    }

    @Test
    void checkoutRejectedForNonAdminWhenPublicCheckoutIsOff() {
        BillingProperties closed = new BillingProperties(
                false,
                false,
                "http://localhost:5173",
                "$7.99",
                "$39.99",
                "$2.99",
                new BillingProperties.Stripe("sk_test", "whsec", "price_month", "price_year", "price_addon"),
                googleConfig());
        BillingService closedBilling = new BillingService(
                closed,
                stripeGateway,
                userRepository,
                subscriptionRepository,
                creditService,
                new AgentProperties("", "", "", 10, 10, 40, 90, 0, 0, 0, 0),
                playBillingGateway);
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));

        ApiException ex = assertThrows(
                ApiException.class, () -> closedBilling.createCheckout(USER_ID, BillingPlan.MONTHLY, "/pro"));
        assertEquals(HttpStatus.SERVICE_UNAVAILABLE, ex.getStatus());
        assertEquals("Billing is not configured", ex.getMessage());
        verify(stripeGateway, never()).createCheckout(any(), any(), any(), any(), any(), any(), anyBoolean());
    }

    @Test
    void grantAdminYearlyGivesProUntilNextYear() {
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));
        when(userRepository.save(user)).thenReturn(user);

        billingService.grantAdminSubscription(USER_ID, BillingPlan.YEARLY);

        assertEquals(1, rows.size());
        assertEquals(BillingProvider.ADMIN, rows.get(0).getProvider());
        assertEquals("admin:" + USER_ID, rows.get(0).getProviderSubscriptionId());
        assertEquals(BillingPlan.YEARLY, rows.get(0).getPlan());
        assertEquals(SubscriptionStatus.ACTIVE, rows.get(0).getStatus());
        assertFalse(rows.get(0).isCancelAtPeriodEnd());
        long days = Duration.between(Instant.now(), rows.get(0).getCurrentPeriodEnd()).toDays();
        assertTrue(days >= 364 && days <= 367);
        assertTrue(user.isProLicensed());
        assertEquals(rows.get(0).getCurrentPeriodEnd(), user.getProExpiresAt());
        verify(creditService).snapshot(user);
        verify(stripeGateway, never()).createCheckout(any(), any(), any(), any(), any(), any(), anyBoolean());
    }

    @Test
    void grantAdminMonthlyCanBeCanceledImmediately() {
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));
        when(userRepository.save(user)).thenReturn(user);

        billingService.grantAdminSubscription(USER_ID, BillingPlan.MONTHLY);
        long days = Duration.between(Instant.now(), rows.get(0).getCurrentPeriodEnd()).toDays();
        assertTrue(days >= 27 && days <= 32);
        assertTrue(ProAccess.allowed(user));

        billingService.cancelAdminSubscription(USER_ID);

        assertEquals(SubscriptionStatus.CANCELED, rows.get(0).getStatus());
        assertFalse(rows.get(0).getCurrentPeriodEnd().isAfter(Instant.now()));
        assertFalse(user.isProLicensed());
        assertFalse(ProAccess.allowed(user));
    }

    @Test
    void cancelAdminSubscriptionRejectedWhenMissing() {
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));

        ApiException ex = assertThrows(ApiException.class, () -> billingService.cancelAdminSubscription(USER_ID));
        assertEquals(HttpStatus.NOT_FOUND, ex.getStatus());
        assertEquals("No admin subscription", ex.getMessage());
    }

    @Test
    void grantAdminRejectsAddonPlan() {
        ApiException ex =
                assertThrows(ApiException.class, () -> billingService.grantAdminSubscription(USER_ID, BillingPlan.ADDON));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertEquals("Invalid billing plan", ex.getMessage());
        verify(userRepository, never()).findById(USER_ID);
    }

    @Test
    void mapsStripeStatuses() {
        assertEquals(SubscriptionStatus.ACTIVE, BillingService.statusFrom("active"));
        assertEquals(SubscriptionStatus.PAST_DUE, BillingService.statusFrom("past_due"));
        assertEquals(SubscriptionStatus.CANCELED, BillingService.statusFrom("canceled"));
        assertEquals(SubscriptionStatus.INCOMPLETE, BillingService.statusFrom("incomplete"));
    }

    @Test
    void googleMonthlyPurchaseGrantsPro() {
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));
        when(userRepository.save(user)).thenReturn(user);
        when(playBillingGateway.enabled()).thenReturn(true);
        Instant end = Instant.now().plusSeconds(60 * 60 * 24 * 30);
        when(playBillingGateway.verifySubscription("pro_monthly", "token-1"))
                .thenReturn(new PlayPurchaseRecord(
                        "pro_monthly",
                        "token-1",
                        "GPA.123",
                        USER_ID.toString(),
                        true,
                        true,
                        false,
                        false,
                        end,
                        false));

        billingService.completeGooglePurchase(USER_ID, "pro_monthly", "token-1", "GPA.123");

        assertEquals(1, rows.size());
        assertEquals(BillingProvider.GOOGLE, rows.get(0).getProvider());
        assertEquals("token-1", rows.get(0).getProviderSubscriptionId());
        assertEquals(BillingPlan.MONTHLY, rows.get(0).getPlan());
        assertEquals(SubscriptionStatus.ACTIVE, rows.get(0).getStatus());
        assertTrue(user.isProLicensed());
        assertEquals(end, user.getProExpiresAt());
        verify(playBillingGateway).acknowledgeSubscription("pro_monthly", "token-1");
        verify(stripeGateway, never()).createCheckout(any(), any(), any(), any(), any(), any(), anyBoolean());
    }

    @Test
    void googleAddonPurchaseGrantsCredits() {
        user.setProLicensed(true);
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));
        when(playBillingGateway.enabled()).thenReturn(true);
        when(playBillingGateway.verifyProduct("credits_addon", "token-addon"))
                .thenReturn(new PlayPurchaseRecord(
                        "credits_addon",
                        "token-addon",
                        "GPA.addon",
                        USER_ID.toString(),
                        false,
                        true,
                        false,
                        false,
                        null,
                        false));

        billingService.completeGooglePurchase(USER_ID, "credits_addon", "token-addon", "GPA.addon");

        verify(creditService).grantAddonPurchase(USER_ID, "token-addon");
        verify(playBillingGateway).acknowledgeProduct("credits_addon", "token-addon");
        assertTrue(rows.isEmpty());
    }
}
