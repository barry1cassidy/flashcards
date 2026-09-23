package com.flashcards.billing;

public record GooglePurchaseRequest(String productId, String purchaseToken, String orderId) {
}
