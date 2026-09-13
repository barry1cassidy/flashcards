package com.flashcards.admin;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record AdminUserResponse(
        UUID id,
        String email,
        String displayName,
        Instant createdAt,
        String signIn,
        boolean admin,
        boolean teacherMode,
        boolean proLicensed,
        boolean proActive,
        Instant proExpiresAt,
        String stripeCustomerId,
        int includedCredits,
        int addonCredits,
        String creditPeriod,
        List<AdminSubscriptionResponse> subscriptions) {
}
