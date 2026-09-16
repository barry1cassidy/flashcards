package com.flashcards.billing;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

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
                new BillingProperties.Stripe("sk_test", "whsec", "price_month", "price_year", "price_addon"));
        AgentProperties agentProperties = new AgentProperties("", "", "", 10, 10, 40, 90, 0, 0, 0, 0);
        billingService = new BillingService(
                properties, stripeGateway, userRepository, subscriptionRepository, creditService, agentProperties);
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
                .when(subscriptionRepository.findByProviderAndProviderSubscriptionId(eq(BillingProvider.STRIPE), any()))
                .thenAnswer(invocation -> {
                    String id = invocation.getArgument(1);
                    return rows.stream().filter(row -> row.getProviderSubscriptionId().equals(id)).findFirst();
                });
        lenient().when(creditService.snapshot(any(User.class))).thenAnswer(invocation -> {
            User current = invocation.getArgument(0);
            return CreditBalance.of(current.getAgentIncludedCredits(), current.getAgentAddonCredits());
        });
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
                new BillingProperties.Stripe("sk_test", "whsec", "price_month", "price_year", "price_addon"));
        BillingService closedBilling = new BillingService(
                closed, stripeGateway, userRepository, subscriptionRepository, creditService, new AgentProperties("", "", "", 10, 10, 40, 90, 0, 0, 0, 0));
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));

        ApiException ex = assertThrows(
                ApiException.class, () -> closedBilling.createCheckout(USER_ID, BillingPlan.MONTHLY, "/pro"));
        assertEquals(HttpStatus.SERVICE_UNAVAILABLE, ex.getStatus());
        assertEquals("Billing is not configured", ex.getMessage());
        verify(stripeGateway, never()).createCheckout(any(), any(), any(), any(), any(), any(), anyBoolean());
    }

    @Test
    void mapsStripeStatuses() {
        assertEquals(SubscriptionStatus.ACTIVE, BillingService.statusFrom("active"));
        assertEquals(SubscriptionStatus.PAST_DUE, BillingService.statusFrom("past_due"));
        assertEquals(SubscriptionStatus.CANCELED, BillingService.statusFrom("canceled"));
        assertEquals(SubscriptionStatus.INCOMPLETE, BillingService.statusFrom("incomplete"));
    }
}
