package com.flashcards.billing;

import java.time.Instant;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import com.flashcards.common.ApiException;

@Service
public class AppleBillingGatewayImpl implements AppleBillingGateway {

    private static final Logger log = LoggerFactory.getLogger(AppleBillingGatewayImpl.class);

    private final BillingProperties properties;
    private final AppleJwsVerifier verifier = new AppleJwsVerifier();

    public AppleBillingGatewayImpl(BillingProperties properties) {
        this.properties = properties;
    }

    @Override
    public boolean enabled() {
        return properties.appleIapEnabled();
    }

    @Override
    public boolean addonEnabled() {
        return enabled() && properties.appleAddonEnabled();
    }

    @Override
    public ApplePurchaseRecord verify(String signedTransaction) {
        requireEnabled();
        try {
            AppleJwsVerifier.DecodedTransaction decoded = verifier.verify(signedTransaction);
            if (!properties.appleBundleId().equals(decoded.bundleId())) {
                throw paymentFailed();
            }
            boolean revoked = decoded.revokedAt() != null;
            Instant expiry = decoded.expiresAt();
            boolean active = !revoked
                    && (expiry == null || !expiry.isBefore(Instant.now()));
            return new ApplePurchaseRecord(
                    decoded.productId(),
                    decoded.originalTransactionId(),
                    decoded.transactionId(),
                    decoded.appAccountToken(),
                    decoded.subscription(),
                    active,
                    expiry,
                    false);
        } catch (ApiException ex) {
            throw ex;
        } catch (IllegalArgumentException ex) {
            log.warn("Apple transaction verify failed");
            throw paymentFailed();
        }
    }

    private void requireEnabled() {
        if (!enabled()) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "Billing is not configured");
        }
    }

    private static ApiException paymentFailed() {
        return new ApiException(HttpStatus.BAD_GATEWAY, "Payment failed");
    }
}
