package com.flashcards.billing;

public record ApplePurchaseRequest(String productId, String signedTransaction, String transactionId) {
}
