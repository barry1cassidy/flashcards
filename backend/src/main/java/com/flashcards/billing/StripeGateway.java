package com.flashcards.billing;

public interface StripeGateway {

    boolean configured();

    String createCustomer(String email, String name, String userId);

    boolean customerExists(String customerId);

    StripeCheckoutSession createCheckout(
            String customerId,
            String priceId,
            String successUrl,
            String cancelUrl,
            String userId,
            String plan,
            boolean subscription);

    StripeCheckoutSession retrieveCheckout(String sessionId);

    StripeSnapshot retrieveSubscription(String subscriptionId);

    String createPortalUrl(String customerId, String returnUrl);

    StripeWebhookEvent parseWebhook(byte[] payload, String signature);
}
