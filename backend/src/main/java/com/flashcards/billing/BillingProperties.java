package com.flashcards.billing;

import java.util.Locale;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.billing")
public record BillingProperties(
        boolean stubEnabled,
        boolean publicCheckout,
        String publicAppUrl,
        String monthlyPriceDisplay,
        String yearlyPriceDisplay,
        String addonPriceDisplay,
        Stripe stripe,
        Google google,
        Apple apple,
        String allowEmails) {

    public record Stripe(
            String secretKey, String webhookSecret, String priceMonthly, String priceYearly, String priceAddon) {
        boolean hasSecretKey() {
            return notBlank(secretKey);
        }

        boolean hasWebhookSecret() {
            return notBlank(webhookSecret);
        }
    }

    public record Google(
            String packageName,
            String credentialsPath,
            String productMonthly,
            String productYearly,
            String productAddon) {
        boolean enabled() {
            return notBlank(packageName)
                    && notBlank(credentialsPath)
                    && notBlank(productMonthly)
                    && notBlank(productYearly);
        }

        boolean addonEnabled() {
            return enabled() && notBlank(productAddon);
        }
    }

    public record Apple(
            String bundleId, String productMonthly, String productYearly, String productAddon) {
        boolean enabled() {
            return notBlank(bundleId) && notBlank(productMonthly) && notBlank(productYearly);
        }

        boolean addonEnabled() {
            return enabled() && notBlank(productAddon);
        }
    }

    public boolean stripeCheckoutEnabled() {
        Stripe config = stripe;
        return config != null
                && config.hasSecretKey()
                && notBlank(config.priceMonthly())
                && notBlank(config.priceYearly());
    }

    public boolean addonCheckoutEnabled() {
        Stripe config = stripe;
        return config != null && config.hasSecretKey() && notBlank(config.priceAddon());
    }

    public boolean stripeWebhookEnabled() {
        return stripe != null && stripe.hasSecretKey() && stripe.hasWebhookSecret();
    }

    public boolean googlePlayEnabled() {
        return google != null && google.enabled();
    }

    public boolean googleAddonEnabled() {
        return google != null && google.addonEnabled();
    }

    public boolean appleIapEnabled() {
        return apple != null && apple.enabled();
    }

    public boolean appleAddonEnabled() {
        return apple != null && apple.addonEnabled();
    }

    public String appleBundleId() {
        return apple == null || !notBlank(apple.bundleId()) ? "" : apple.bundleId().trim();
    }

    public boolean paidCheckoutAllowed(boolean admin) {
        return paidCheckoutAllowed(admin, null);
    }

    public boolean paidCheckoutAllowed(boolean admin, String email) {
        return publicCheckout || admin || emailAllowed(email);
    }

    public boolean emailAllowed(String email) {
        if (!notBlank(email) || !notBlank(allowEmails)) {
            return false;
        }
        String normalized = email.trim().toLowerCase(Locale.ROOT);
        for (String raw : allowEmails.split(",")) {
            String entry = raw.trim().toLowerCase(Locale.ROOT);
            if (entry.isEmpty()) {
                continue;
            }
            if (entry.startsWith("*@") && normalized.endsWith(entry.substring(1))) {
                return true;
            }
            if (normalized.equals(entry)) {
                return true;
            }
        }
        return false;
    }

    public boolean stubAllowed(boolean admin) {
        return admin && (stubEnabled || !publicCheckout);
    }

    public String appUrl() {
        String url = publicAppUrl == null || publicAppUrl.isBlank() ? "http://localhost:5173" : publicAppUrl.trim();
        return url.endsWith("/") ? url.substring(0, url.length() - 1) : url;
    }

    public String monthlyPrice() {
        return notBlank(monthlyPriceDisplay) ? monthlyPriceDisplay : "$4.99";
    }

    public String yearlyPrice() {
        return notBlank(yearlyPriceDisplay) ? yearlyPriceDisplay : "$34.99";
    }

    public String addonPrice() {
        return notBlank(addonPriceDisplay) ? addonPriceDisplay : "$2.99";
    }

    public String priceId(BillingPlan plan) {
        if (stripe == null || plan == null) {
            return "";
        }
        return switch (plan) {
            case YEARLY -> stripe.priceYearly();
            case ADDON -> stripe.priceAddon();
            case MONTHLY -> stripe.priceMonthly();
        };
    }

    public BillingPlan planForPrice(String priceId) {
        if (stripe != null && notBlank(priceId) && priceId.equals(stripe.priceYearly())) {
            return BillingPlan.YEARLY;
        }
        if (stripe != null && notBlank(priceId) && priceId.equals(stripe.priceAddon())) {
            return BillingPlan.ADDON;
        }
        return BillingPlan.MONTHLY;
    }

    public BillingPlan planForGoogleProduct(String productId) {
        if (google == null || !notBlank(productId)) {
            throw new IllegalArgumentException("Invalid billing plan");
        }
        if (productId.equals(google.productYearly())) {
            return BillingPlan.YEARLY;
        }
        if (productId.equals(google.productAddon())) {
            return BillingPlan.ADDON;
        }
        if (productId.equals(google.productMonthly())) {
            return BillingPlan.MONTHLY;
        }
        throw new IllegalArgumentException("Invalid billing plan");
    }

    public BillingPlan planForAppleProduct(String productId) {
        if (apple == null || !notBlank(productId)) {
            throw new IllegalArgumentException("Invalid billing plan");
        }
        if (productId.equals(apple.productYearly())) {
            return BillingPlan.YEARLY;
        }
        if (productId.equals(apple.productAddon())) {
            return BillingPlan.ADDON;
        }
        if (productId.equals(apple.productMonthly())) {
            return BillingPlan.MONTHLY;
        }
        throw new IllegalArgumentException("Invalid billing plan");
    }

    private static boolean notBlank(String value) {
        return value != null && !value.isBlank();
    }
}
