package com.flashcards.billing;

import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.flashcards.agent.AgentCreditService;
import com.flashcards.agent.AgentProperties;
import com.flashcards.agent.CreditBalance;
import com.flashcards.auth.AuthService;
import com.flashcards.auth.UserResponse;
import com.flashcards.common.ApiException;
import com.flashcards.security.SubscriptionAccess;
import com.flashcards.user.User;
import com.flashcards.user.UserRepository;

@Service
public class BillingService {

    private static final Logger log = LoggerFactory.getLogger(BillingService.class);

    private final BillingProperties properties;
    private final StripeGateway stripeGateway;
    private final UserRepository userRepository;
    private final UserSubscriptionRepository subscriptionRepository;
    private final AgentCreditService creditService;
    private final AgentProperties agentProperties;
    private final PlayBillingGateway playBillingGateway;

    public BillingService(
            BillingProperties properties,
            StripeGateway stripeGateway,
            UserRepository userRepository,
            UserSubscriptionRepository subscriptionRepository,
            AgentCreditService creditService,
            AgentProperties agentProperties,
            PlayBillingGateway playBillingGateway) {
        this.properties = properties;
        this.stripeGateway = stripeGateway;
        this.userRepository = userRepository;
        this.subscriptionRepository = subscriptionRepository;
        this.creditService = creditService;
        this.agentProperties = agentProperties;
        this.playBillingGateway = playBillingGateway;
    }

    @Transactional(readOnly = true)
    public BillingStatusResponse status(UUID userId) {
        User user = requireOwnAccount(userId);
        UserSubscription current = currentSubscription(userId);
        CreditBalance credits = ProAccess.allowed(user) ? creditService.snapshot(user) : CreditBalance.of(0, user.getAgentAddonCredits());
        return new BillingStatusResponse(
                properties.stripeCheckoutEnabled(),
                properties.stubAllowed(user.isAdmin()),
                properties.publicCheckout(),
                ProAccess.allowed(user),
                current == null ? null : current.getPlan(),
                current == null ? null : current.getStatus(),
                user.getProExpiresAt(),
                current != null && current.isCancelAtPeriodEnd(),
                current == null ? null : current.getProvider(),
                properties.monthlyPrice(),
                properties.yearlyPrice(),
                properties.addonPrice(),
                properties.addonCheckoutEnabled() && properties.paidCheckoutAllowed(user.isAdmin()),
                credits.includedCredits(),
                credits.addonCredits(),
                credits.remainingCredits(),
                agentProperties.monthlyCredits(),
                agentProperties.addonCredits(),
                playBillingGateway.enabled(),
                playBillingGateway.addonEnabled(),
                googleProductId(properties.google() == null ? null : properties.google().productMonthly()),
                googleProductId(properties.google() == null ? null : properties.google().productYearly()),
                googleProductId(properties.google() == null ? null : properties.google().productAddon()));
    }

    @Transactional
    public UserResponse completeGooglePurchase(UUID userId, String productId, String purchaseToken, String orderId) {
        if (!playBillingGateway.enabled()) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "Billing is not configured");
        }
        if (productId == null || productId.isBlank() || purchaseToken == null || purchaseToken.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Validation failed");
        }
        User user = requireOwnAccount(userId);
        String sku = productId.trim();
        String token = purchaseToken.trim();
        BillingPlan plan;
        try {
            plan = properties.planForGoogleProduct(sku);
        } catch (IllegalArgumentException ex) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid billing plan");
        }
        PlayPurchaseRecord record = plan == BillingPlan.ADDON
                ? playBillingGateway.verifyProduct(sku, token)
                : playBillingGateway.verifySubscription(sku, token);
        if (record.productId() != null && !record.productId().isBlank()) {
            sku = record.productId();
            try {
                plan = properties.planForGoogleProduct(sku);
            } catch (IllegalArgumentException ex) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid billing plan");
            }
        }
        String obfuscated = record.obfuscatedAccountId();
        if (obfuscated != null && !obfuscated.isBlank() && !obfuscated.equals(user.getId().toString())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Not authenticated");
        }
        if (plan == BillingPlan.ADDON) {
            if (!record.active()) {
                throw new ApiException(HttpStatus.BAD_GATEWAY, "Payment failed");
            }
            ProAccess.require(user);
            creditService.grantAddonPurchase(user.getId(), token);
            if (!record.consumed()) {
                playBillingGateway.acknowledgeProduct(sku, token);
            }
            return AuthService.toUserResponse(requireUser(userId));
        }
        applyGoogleSubscription(user, record, plan, orderId);
        if (record.active() && !record.acknowledged()) {
            playBillingGateway.acknowledgeSubscription(sku, token);
        }
        return AuthService.toUserResponse(requireUser(userId));
    }

    void applyGoogleSubscription(User user, PlayPurchaseRecord record, BillingPlan plan, String orderId) {
        String token = record.purchaseToken();
        UserSubscription row = subscriptionRepository
                .findByProviderAndProviderSubscriptionId(BillingProvider.GOOGLE, token)
                .or(() -> subscriptionRepository.findByUser_IdAndProvider(user.getId(), BillingProvider.GOOGLE).stream()
                        .findFirst())
                .orElseGet(UserSubscription::new);
        row.setUser(user);
        row.setProvider(BillingProvider.GOOGLE);
        row.setProviderCustomerId(orderId == null || orderId.isBlank() ? record.orderId() : orderId.trim());
        row.setProviderSubscriptionId(token);
        row.setPlan(plan);
        row.setStatus(googleStatus(record));
        row.setCurrentPeriodEnd(record.expiryTime());
        row.setCancelAtPeriodEnd(record.cancelAtPeriodEnd());
        subscriptionRepository.save(row);
        refreshEntitlement(user);
    }

    static SubscriptionStatus googleStatus(PlayPurchaseRecord record) {
        Instant now = Instant.now();
        if (record.active() && (record.expiryTime() == null || !record.expiryTime().isBefore(now))) {
            return SubscriptionStatus.ACTIVE;
        }
        return SubscriptionStatus.EXPIRED;
    }

    private static String googleProductId(String productId) {
        return productId == null || productId.isBlank() ? "" : productId;
    }

    @Transactional
    public CheckoutResponse createCheckout(UUID userId, BillingPlan plan, String returnPath) {
        if (plan == BillingPlan.ADDON) {
            return createAddonCheckout(userId, returnPath);
        }
        if (!properties.stripeCheckoutEnabled()) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "Billing is not configured");
        }
        if (plan == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid billing plan");
        }
        User user = requireOwnAccount(userId);
        requirePaidCheckout(user);
        if (hasOpenStripeSubscription(userId)) {
            throw new ApiException(HttpStatus.CONFLICT, "Already subscribed");
        }
        String customerId = ensureCustomer(user);
        String page = checkoutReturnPath(returnPath);
        String successUrl = properties.appUrl() + page + "?billing=success&session_id={CHECKOUT_SESSION_ID}";
        String cancelUrl = properties.appUrl() + page + "?billing=canceled";
        StripeCheckoutSession session = stripeGateway.createCheckout(
                customerId,
                properties.priceId(plan),
                successUrl,
                cancelUrl,
                user.getId().toString(),
                plan.name(),
                true);
        if (session.url() == null || session.url().isBlank()) {
            throw new ApiException(HttpStatus.BAD_GATEWAY, "Payment failed");
        }
        return new CheckoutResponse(session.url());
    }

    private CheckoutResponse createAddonCheckout(UUID userId, String returnPath) {
        if (!properties.addonCheckoutEnabled()) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "Billing is not configured");
        }
        User user = requireOwnAccount(userId);
        requirePaidCheckout(user);
        ProAccess.require(user);
        String customerId = ensureCustomer(user);
        String page = checkoutReturnPath(returnPath);
        String successUrl = properties.appUrl() + page + "?billing=success&session_id={CHECKOUT_SESSION_ID}";
        String cancelUrl = properties.appUrl() + page + "?billing=canceled";
        StripeCheckoutSession session = stripeGateway.createCheckout(
                customerId,
                properties.priceId(BillingPlan.ADDON),
                successUrl,
                cancelUrl,
                user.getId().toString(),
                BillingPlan.ADDON.name(),
                false);
        if (session.url() == null || session.url().isBlank()) {
            throw new ApiException(HttpStatus.BAD_GATEWAY, "Payment failed");
        }
        return new CheckoutResponse(session.url());
    }

    @Transactional
    public UserResponse completeCheckout(UUID userId, String sessionId) {
        if (sessionId == null || sessionId.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Validation failed");
        }
        StripeCheckoutSession session = stripeGateway.retrieveCheckout(sessionId.trim());
        User user = requireOwnAccount(userId);
        if (session.clientReferenceId() != null && !session.clientReferenceId().equals(user.getId().toString())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Not authenticated");
        }
        applyCheckout(session);
        user = requireUser(userId);
        return AuthService.toUserResponse(user);
    }

    @Transactional
    public PortalResponse createPortal(UUID userId) {
        if (!properties.stripeCheckoutEnabled()) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "Billing is not configured");
        }
        User user = requireOwnAccount(userId);
        String customerId = user.getStripeCustomerId();
        if (customerId == null || customerId.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "No Stripe customer");
        }
        return new PortalResponse(stripeGateway.createPortalUrl(customerId, properties.appUrl() + "/pro"));
    }

    @Transactional
    public void grantAdminSubscription(UUID userId, BillingPlan plan) {
        if (plan != BillingPlan.MONTHLY && plan != BillingPlan.YEARLY) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid billing plan");
        }
        User user = userRepository
                .findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));
        String subscriptionId = adminSubscriptionId(userId);
        UserSubscription row = subscriptionRepository
                .findByProviderAndProviderSubscriptionId(BillingProvider.ADMIN, subscriptionId)
                .orElseGet(UserSubscription::new);
        row.setUser(user);
        row.setProvider(BillingProvider.ADMIN);
        row.setProviderCustomerId(null);
        row.setProviderSubscriptionId(subscriptionId);
        row.setPlan(plan);
        row.setStatus(SubscriptionStatus.ACTIVE);
        row.setCurrentPeriodEnd(adminPeriodEnd(plan));
        row.setCancelAtPeriodEnd(false);
        subscriptionRepository.save(row);
        refreshEntitlement(user);
    }

    @Transactional
    public void cancelAdminSubscription(UUID userId) {
        User user = userRepository
                .findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));
        UserSubscription row = subscriptionRepository
                .findByProviderAndProviderSubscriptionId(BillingProvider.ADMIN, adminSubscriptionId(userId))
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "No admin subscription"));
        Instant now = Instant.now();
        if (!row.grantsAccess(now)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "No admin subscription");
        }
        row.setStatus(SubscriptionStatus.CANCELED);
        row.setCancelAtPeriodEnd(false);
        row.setCurrentPeriodEnd(now);
        subscriptionRepository.save(row);
        refreshEntitlement(user);
    }

    static String adminSubscriptionId(UUID userId) {
        return "admin:" + userId;
    }

    static Instant adminPeriodEnd(BillingPlan plan) {
        var now = Instant.now().atZone(ZoneOffset.UTC);
        return (plan == BillingPlan.YEARLY ? now.plusYears(1) : now.plusMonths(1)).toInstant();
    }

    @Transactional
    public UserResponse stubPro(UUID userId, boolean proLicensed) {
        User user = requireUser(userId);
        if (!properties.stubAllowed(user.isAdmin())) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Billing stub is disabled");
        }
        if (proLicensed) {
            user.setProLicensed(true);
            userRepository.save(user);
            creditService.snapshot(user);
        } else {
            refreshEntitlement(user);
            User latest = requireUser(userId);
            creditService.snapshot(latest);
        }
        return AuthService.toUserResponse(requireUser(userId));
    }

    @Transactional
    public void handleStripeWebhook(byte[] payload, String signature) {
        StripeWebhookEvent event = stripeGateway.parseWebhook(payload, signature);
        if (event.checkoutSessionId() != null && "checkout.session.completed".equals(event.type())) {
            applyCheckout(stripeGateway.retrieveCheckout(event.checkoutSessionId()));
            return;
        }
        if (event.subscriptionId() != null) {
            applySnapshot(stripeGateway.retrieveSubscription(event.subscriptionId()));
        }
    }

    void applyCheckout(StripeCheckoutSession session) {
        if (session.addonPurchase()) {
            if (!session.paid()) {
                return;
            }
            User user = findUser(
                    session.clientReferenceId(),
                    session.metadata() == null ? null : session.metadata().get("userId"),
                    session.customerId());
            if (user == null) {
                log.warn("Stripe add-on checkout {} had no matching user", session.id());
                return;
            }
            if (session.customerId() != null) {
                user.setStripeCustomerId(session.customerId());
                userRepository.save(user);
            }
            creditService.grantAddonPurchase(user.getId(), session.id());
            return;
        }
        if (session.subscriptionId() != null && !session.subscriptionId().isBlank()) {
            applySnapshot(stripeGateway.retrieveSubscription(session.subscriptionId()));
            return;
        }
        User user = findUser(session.clientReferenceId(), session.metadata() == null ? null : session.metadata().get("userId"), session.customerId());
        if (user == null) {
            log.warn("Stripe checkout {} had no matching user", session.id());
            return;
        }
        if (session.customerId() != null) {
            user.setStripeCustomerId(session.customerId());
            userRepository.save(user);
        }
    }

    void applySnapshot(StripeSnapshot snapshot) {
        if (snapshot == null || snapshot.subscriptionId() == null || snapshot.subscriptionId().isBlank()) {
            return;
        }
        User user = findUser(
                snapshot.metadata() == null ? null : snapshot.metadata().get("userId"),
                null,
                snapshot.customerId());
        if (user == null) {
            log.warn("Stripe subscription {} had no matching user", snapshot.subscriptionId());
            return;
        }
        if (snapshot.customerId() != null && !snapshot.customerId().isBlank()) {
            user.setStripeCustomerId(snapshot.customerId());
        }
        UserSubscription row = subscriptionRepository
                .findByProviderAndProviderSubscriptionId(BillingProvider.STRIPE, snapshot.subscriptionId())
                .orElseGet(UserSubscription::new);
        row.setUser(user);
        row.setProvider(BillingProvider.STRIPE);
        row.setProviderCustomerId(snapshot.customerId());
        row.setProviderSubscriptionId(snapshot.subscriptionId());
        row.setPlan(planFrom(snapshot));
        row.setStatus(statusFrom(snapshot.status()));
        row.setCurrentPeriodEnd(snapshot.currentPeriodEnd());
        row.setCancelAtPeriodEnd(snapshot.cancelAtPeriodEnd());
        subscriptionRepository.save(row);
        refreshEntitlement(user);
    }

    private BillingPlan planFrom(StripeSnapshot snapshot) {
        if (snapshot.metadata() != null && snapshot.metadata().get("plan") != null) {
            try {
                return BillingPlan.valueOf(snapshot.metadata().get("plan").trim().toUpperCase(Locale.ROOT));
            } catch (IllegalArgumentException ignored) {
                // fall through to price id
            }
        }
        return properties.planForPrice(snapshot.priceId());
    }

    static SubscriptionStatus statusFrom(String stripeStatus) {
        if (stripeStatus == null) {
            return SubscriptionStatus.INCOMPLETE;
        }
        return switch (stripeStatus) {
            case "active" -> SubscriptionStatus.ACTIVE;
            case "past_due" -> SubscriptionStatus.PAST_DUE;
            case "trialing" -> SubscriptionStatus.TRIALING;
            case "canceled", "unpaid", "incomplete_expired" -> SubscriptionStatus.CANCELED;
            case "paused" -> SubscriptionStatus.EXPIRED;
            default -> SubscriptionStatus.INCOMPLETE;
        };
    }

    private void refreshEntitlement(User user) {
        Instant now = Instant.now();
        List<UserSubscription> rows = subscriptionRepository.findByUser_Id(user.getId());
        Optional<UserSubscription> granted = rows.stream()
                .filter(row -> row.grantsAccess(now))
                .max(Comparator.comparing(UserSubscription::getCurrentPeriodEnd, Comparator.nullsLast(Comparator.naturalOrder())));
        if (granted.isPresent()) {
            user.setProLicensed(true);
            user.setProExpiresAt(granted.get().getCurrentPeriodEnd());
        } else {
            user.setProLicensed(false);
            Instant ended = rows.stream()
                    .map(UserSubscription::getCurrentPeriodEnd)
                    .filter(end -> end != null)
                    .max(Comparator.naturalOrder())
                    .orElse(null);
            user.setProExpiresAt(ended);
        }
        userRepository.save(user);
        creditService.snapshot(user);
    }

    private boolean hasOpenStripeSubscription(UUID userId) {
        Instant now = Instant.now();
        return subscriptionRepository.findByUser_Id(userId).stream()
                .filter(row -> row.getProvider() == BillingProvider.STRIPE)
                .anyMatch(row -> row.grantsAccess(now));
    }

    private void requirePaidCheckout(User user) {
        if (!properties.paidCheckoutAllowed(user.isAdmin())) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "Billing is not configured");
        }
    }

    private UserSubscription currentSubscription(UUID userId) {
        Instant now = Instant.now();
        List<UserSubscription> rows = subscriptionRepository.findByUser_Id(userId);
        return rows.stream()
                .filter(row -> row.grantsAccess(now))
                .max(Comparator.comparing(UserSubscription::getCurrentPeriodEnd, Comparator.nullsLast(Comparator.naturalOrder())))
                .or(() -> rows.stream()
                        .max(Comparator.comparing(UserSubscription::getUpdatedAt, Comparator.nullsLast(Comparator.naturalOrder()))))
                .orElse(null);
    }

    private String ensureCustomer(User user) {
        String existing = user.getStripeCustomerId();
        if (existing != null && !existing.isBlank() && stripeGateway.customerExists(existing)) {
            return existing;
        }
        String customerId = stripeGateway.createCustomer(user.getEmail(), user.getDisplayName(), user.getId().toString());
        user.setStripeCustomerId(customerId);
        userRepository.save(user);
        return customerId;
    }

    private User findUser(String userId, String metadataUserId, String customerId) {
        String id = userId == null || userId.isBlank() ? metadataUserId : userId;
        if (id != null && !id.isBlank()) {
            try {
                return userRepository.findById(UUID.fromString(id.trim())).orElse(null);
            } catch (IllegalArgumentException ignored) {
                // not a UUID
            }
        }
        if (customerId != null && !customerId.isBlank()) {
            return userRepository.findByStripeCustomerId(customerId).orElse(null);
        }
        return null;
    }

    private static String checkoutReturnPath(String returnPath) {
        if ("/agent".equals(returnPath) || "/create-with-ai".equals(returnPath) || "/pro".equals(returnPath)) {
            return returnPath;
        }
        return "/pro";
    }

    private User requireOwnAccount(UUID actorId) {
        User actor = requireUser(actorId);
        SubscriptionAccess.requireOwnerOrAdmin(actor, actorId);
        return actor;
    }

    private User requireUser(UUID userId) {
        return userRepository
                .findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Not authenticated"));
    }
}
