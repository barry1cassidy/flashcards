package com.flashcards.billing;

public interface AppleBillingGateway {

    boolean enabled();

    boolean addonEnabled();

    ApplePurchaseRecord verify(String signedTransaction);
}
