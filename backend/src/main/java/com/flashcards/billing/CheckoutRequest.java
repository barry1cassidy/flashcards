package com.flashcards.billing;

public record CheckoutRequest(BillingPlan plan, String returnPath) {
}
