package com.flashcards.agent;

public record AgentStatusResponse(
        boolean proRequired,
        boolean configured,
        int includedCredits,
        int addonCredits,
        int remainingCredits,
        int monthlyAllowance,
        int addonPackCredits,
        String addonPrice,
        boolean addonCheckoutEnabled) {
}
