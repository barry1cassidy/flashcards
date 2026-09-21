package com.flashcards.admin;

import com.flashcards.billing.BillingPlan;

public record AdminGrantRequest(BillingPlan plan) {
}
