package com.flashcards.billing;

public interface PlayBillingGateway {

    boolean enabled();

    boolean addonEnabled();

    PlayPurchaseRecord verifySubscription(String productId, String purchaseToken);

    PlayPurchaseRecord verifyProduct(String productId, String purchaseToken);

    void acknowledgeSubscription(String productId, String purchaseToken);

    void acknowledgeProduct(String productId, String purchaseToken);
}
