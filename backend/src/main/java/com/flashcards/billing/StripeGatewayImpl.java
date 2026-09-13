package com.flashcards.billing;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import com.flashcards.common.ApiException;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.exception.StripeException;
import com.stripe.model.Customer;
import com.stripe.model.Event;
import com.stripe.model.StripeObject;
import com.stripe.model.Subscription;
import com.stripe.model.SubscriptionItem;
import com.stripe.model.checkout.Session;
import com.stripe.net.RequestOptions;
import com.stripe.net.Webhook;
import com.stripe.param.CustomerCreateParams;
import com.stripe.param.SubscriptionRetrieveParams;
import com.stripe.param.checkout.SessionCreateParams;
import com.stripe.param.checkout.SessionRetrieveParams;

@Component
public class StripeGatewayImpl implements StripeGateway {

    private final BillingProperties properties;

    public StripeGatewayImpl(BillingProperties properties) {
        this.properties = properties;
    }

    @Override
    public boolean configured() {
        return properties.stripeCheckoutEnabled();
    }

    @Override
    public String createCustomer(String email, String name, String userId) {
        try {
            Customer customer = Customer.create(
                    CustomerCreateParams.builder()
                            .setEmail(email)
                            .setName(name)
                            .putMetadata("userId", userId)
                            .build(),
                    options());
            return customer.getId();
        } catch (StripeException ex) {
            throw paymentFailed(ex);
        }
    }

    @Override
    public boolean customerExists(String customerId) {
        if (customerId == null || customerId.isBlank()) {
            return false;
        }
        try {
            Customer.retrieve(customerId, options());
            return true;
        } catch (StripeException ex) {
            return false;
        }
    }

    @Override
    public StripeCheckoutSession createCheckout(
            String customerId,
            String priceId,
            String successUrl,
            String cancelUrl,
            String userId,
            String plan,
            boolean subscription) {
        try {
            SessionCreateParams.Builder builder = SessionCreateParams.builder()
                    .setMode(subscription ? SessionCreateParams.Mode.SUBSCRIPTION : SessionCreateParams.Mode.PAYMENT)
                    .setCustomer(customerId)
                    .setSuccessUrl(successUrl)
                    .setCancelUrl(cancelUrl)
                    .setClientReferenceId(userId)
                    .putMetadata("userId", userId)
                    .putMetadata("plan", plan)
                    .addLineItem(SessionCreateParams.LineItem.builder()
                            .setPrice(priceId)
                            .setQuantity(1L)
                            .build());
            if (subscription) {
                builder.setSubscriptionData(SessionCreateParams.SubscriptionData.builder()
                        .putMetadata("userId", userId)
                        .putMetadata("plan", plan)
                        .build());
            }
            Session session = Session.create(builder.build(), options());
            return toCheckout(session);
        } catch (StripeException ex) {
            throw paymentFailed(ex);
        }
    }

    @Override
    public StripeCheckoutSession retrieveCheckout(String sessionId) {
        try {
            Session session = Session.retrieve(
                    sessionId,
                    SessionRetrieveParams.builder().addExpand("subscription").build(),
                    options());
            return toCheckout(session);
        } catch (StripeException ex) {
            throw paymentFailed(ex);
        }
    }

    @Override
    public StripeSnapshot retrieveSubscription(String subscriptionId) {
        try {
            Subscription subscription = Subscription.retrieve(
                    subscriptionId,
                    SubscriptionRetrieveParams.builder().addExpand("items.data.price").build(),
                    options());
            return toSnapshot(subscription);
        } catch (StripeException ex) {
            throw paymentFailed(ex);
        }
    }

    @Override
    public String createPortalUrl(String customerId, String returnUrl) {
        try {
            var session = com.stripe.model.billingportal.Session.create(
                    com.stripe.param.billingportal.SessionCreateParams.builder()
                            .setCustomer(customerId)
                            .setReturnUrl(returnUrl)
                            .build(),
                    options());
            return session.getUrl();
        } catch (StripeException ex) {
            throw paymentFailed(ex);
        }
    }

    @Override
    public StripeWebhookEvent parseWebhook(byte[] payload, String signature) {
        if (!properties.stripeWebhookEnabled()) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Stripe webhook is not configured");
        }
        try {
            Event event = Webhook.constructEvent(
                    new String(payload, StandardCharsets.UTF_8), signature, properties.stripe().webhookSecret());
            return new StripeWebhookEvent(event.getType(), checkoutSessionId(event), subscriptionId(event));
        } catch (SignatureVerificationException ex) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid Stripe signature");
        }
    }

    private RequestOptions options() {
        if (properties.stripe() == null || !properties.stripe().hasSecretKey()) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "Billing is not configured");
        }
        return RequestOptions.builder().setApiKey(properties.stripe().secretKey()).build();
    }

    private static StripeCheckoutSession toCheckout(Session session) {
        String subscriptionId = session.getSubscription();
        if (subscriptionId == null && session.getSubscriptionObject() != null) {
            subscriptionId = session.getSubscriptionObject().getId();
        }
        return new StripeCheckoutSession(
                session.getId(),
                session.getUrl(),
                session.getCustomer(),
                subscriptionId,
                session.getClientReferenceId(),
                session.getPaymentStatus(),
                session.getMetadata() == null ? Map.of() : session.getMetadata());
    }

    private static StripeSnapshot toSnapshot(Subscription subscription) {
        SubscriptionItem item = firstItem(subscription);
        String priceId = null;
        Instant periodEnd = null;
        if (item != null) {
            if (item.getPrice() != null) {
                priceId = item.getPrice().getId();
            }
            if (item.getCurrentPeriodEnd() != null) {
                periodEnd = Instant.ofEpochSecond(item.getCurrentPeriodEnd());
            }
        }
        return new StripeSnapshot(
                subscription.getCustomer(),
                subscription.getId(),
                subscription.getStatus(),
                priceId,
                periodEnd,
                Boolean.TRUE.equals(subscription.getCancelAtPeriodEnd()),
                subscription.getMetadata() == null ? Map.of() : subscription.getMetadata());
    }

    private static SubscriptionItem firstItem(Subscription subscription) {
        if (subscription.getItems() == null || subscription.getItems().getData() == null) {
            return null;
        }
        return subscription.getItems().getData().stream().findFirst().orElse(null);
    }

    private static String checkoutSessionId(Event event) {
        StripeObject object = event.getDataObjectDeserializer().getObject().orElse(null);
        if (object instanceof Session session) {
            return session.getId();
        }
        return null;
    }

    private static String subscriptionId(Event event) {
        StripeObject object = event.getDataObjectDeserializer().getObject().orElse(null);
        if (object instanceof Subscription subscription) {
            return subscription.getId();
        }
        if (object instanceof Session session) {
            if (session.getSubscription() != null) {
                return session.getSubscription();
            }
            if (session.getSubscriptionObject() != null) {
                return session.getSubscriptionObject().getId();
            }
        }
        return null;
    }

    private static ApiException paymentFailed(StripeException ex) {
        return new ApiException(HttpStatus.BAD_GATEWAY, "Payment failed");
    }
}
