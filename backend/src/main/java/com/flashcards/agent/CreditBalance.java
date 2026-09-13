package com.flashcards.agent;

public record CreditBalance(int includedCredits, int addonCredits, int remainingCredits) {

    public static CreditBalance of(int included, int addon) {
        return new CreditBalance(Math.max(0, included), Math.max(0, addon), Math.max(0, included) + Math.max(0, addon));
    }
}
