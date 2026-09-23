package com.flashcards.billing;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import com.flashcards.common.ApiException;
import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.googleapis.json.GoogleJsonResponseException;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.services.androidpublisher.AndroidPublisher;
import com.google.api.services.androidpublisher.AndroidPublisherScopes;
import com.google.api.services.androidpublisher.model.ProductPurchase;
import com.google.api.services.androidpublisher.model.ProductPurchasesAcknowledgeRequest;
import com.google.api.services.androidpublisher.model.SubscriptionPurchaseV2;
import com.google.api.services.androidpublisher.model.SubscriptionPurchasesAcknowledgeRequest;
import com.google.auth.http.HttpCredentialsAdapter;
import com.google.auth.oauth2.GoogleCredentials;

@Service
public class PlayBillingGatewayImpl implements PlayBillingGateway {

    private static final Logger log = LoggerFactory.getLogger(PlayBillingGatewayImpl.class);
    private static final int PURCHASED = 0;
    private static final int CONSUMED = 1;
    private static final int ACKNOWLEDGED = 1;

    private final BillingProperties properties;
    private AndroidPublisher publisher;

    public PlayBillingGatewayImpl(BillingProperties properties) {
        this.properties = properties;
    }

    @Override
    public boolean enabled() {
        return properties.googlePlayEnabled() && Files.isReadable(credentialsFile());
    }

    @Override
    public boolean addonEnabled() {
        return enabled() && properties.googleAddonEnabled();
    }

    @Override
    public PlayPurchaseRecord verifySubscription(String productId, String purchaseToken) {
        requireEnabled();
        try {
            SubscriptionPurchaseV2 purchase = client()
                    .purchases()
                    .subscriptionsv2()
                    .get(packageName(), purchaseToken)
                    .execute();
            return fromSubscription(productId, purchaseToken, purchase);
        } catch (GoogleJsonResponseException ex) {
            log.warn("Play subscription lookup failed: {}", ex.getStatusCode());
            throw paymentFailed();
        } catch (IOException ex) {
            log.warn("Play subscription lookup failed", ex);
            throw paymentFailed();
        }
    }

    @Override
    public PlayPurchaseRecord verifyProduct(String productId, String purchaseToken) {
        requireEnabled();
        try {
            ProductPurchase purchase = client()
                    .purchases()
                    .products()
                    .get(packageName(), productId, purchaseToken)
                    .execute();
            return fromProduct(productId, purchaseToken, purchase);
        } catch (GoogleJsonResponseException ex) {
            log.warn("Play product lookup failed: {}", ex.getStatusCode());
            throw paymentFailed();
        } catch (IOException ex) {
            log.warn("Play product lookup failed", ex);
            throw paymentFailed();
        }
    }

    @Override
    public void acknowledgeSubscription(String productId, String purchaseToken) {
        requireEnabled();
        try {
            client()
                    .purchases()
                    .subscriptions()
                    .acknowledge(
                            packageName(),
                            productId,
                            purchaseToken,
                            new SubscriptionPurchasesAcknowledgeRequest())
                    .execute();
        } catch (GoogleJsonResponseException ex) {
            log.warn("Play subscription acknowledge failed: {}", ex.getStatusCode());
        } catch (IOException ex) {
            log.warn("Play subscription acknowledge failed", ex);
        }
    }

    @Override
    public void acknowledgeProduct(String productId, String purchaseToken) {
        requireEnabled();
        try {
            client()
                    .purchases()
                    .products()
                    .acknowledge(
                            packageName(),
                            productId,
                            purchaseToken,
                            new ProductPurchasesAcknowledgeRequest())
                    .execute();
        } catch (GoogleJsonResponseException ex) {
            log.warn("Play product acknowledge failed: {}", ex.getStatusCode());
        } catch (IOException ex) {
            log.warn("Play product acknowledge failed", ex);
        }
        consumeProduct(productId, purchaseToken);
    }

    private void consumeProduct(String productId, String purchaseToken) {
        try {
            client().purchases().products().consume(packageName(), productId, purchaseToken).execute();
        } catch (GoogleJsonResponseException ex) {
            log.warn("Play product consume failed: {}", ex.getStatusCode());
        } catch (IOException ex) {
            log.warn("Play product consume failed", ex);
        }
    }

    private synchronized AndroidPublisher client() {
        if (publisher != null) {
            return publisher;
        }
        try (InputStream stream = Files.newInputStream(credentialsFile())) {
            GoogleCredentials credentials =
                    GoogleCredentials.fromStream(stream).createScoped(List.of(AndroidPublisherScopes.ANDROIDPUBLISHER));
            publisher = new AndroidPublisher.Builder(
                            GoogleNetHttpTransport.newTrustedTransport(),
                            GsonFactory.getDefaultInstance(),
                            new HttpCredentialsAdapter(credentials))
                    .setApplicationName("zipdeck")
                    .build();
            return publisher;
        } catch (Exception ex) {
            log.warn("Play API client failed to start", ex);
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "Billing is not configured");
        }
    }

    private PlayPurchaseRecord fromSubscription(String requestedProductId, String purchaseToken, SubscriptionPurchaseV2 purchase) {
        String state = purchase.getSubscriptionState() == null ? "" : purchase.getSubscriptionState();
        boolean cancelAtPeriodEnd = "SUBSCRIPTION_STATE_CANCELED".equals(state);
        boolean active = switch (state) {
            case "SUBSCRIPTION_STATE_ACTIVE",
                    "SUBSCRIPTION_STATE_CANCELED",
                    "SUBSCRIPTION_STATE_IN_GRACE_PERIOD" -> true;
            default -> false;
        };
        String productId = requestedProductId;
        Instant expiry = null;
        if (purchase.getLineItems() != null && !purchase.getLineItems().isEmpty()) {
            var item = purchase.getLineItems().get(0);
            if (item.getProductId() != null && !item.getProductId().isBlank()) {
                productId = item.getProductId();
            }
            expiry = parseInstant(item.getExpiryTime());
        }
        if (expiry != null && expiry.isBefore(Instant.now())) {
            active = false;
        }
        String obfuscated = purchase.getExternalAccountIdentifiers() == null
                ? null
                : purchase.getExternalAccountIdentifiers().getObfuscatedExternalAccountId();
        boolean acknowledged = "ACKNOWLEDGEMENT_STATE_ACKNOWLEDGED".equals(purchase.getAcknowledgementState());
        return new PlayPurchaseRecord(
                productId,
                purchaseToken,
                purchase.getLatestOrderId(),
                obfuscated,
                true,
                active,
                acknowledged,
                false,
                expiry,
                cancelAtPeriodEnd);
    }

    private static PlayPurchaseRecord fromProduct(String productId, String purchaseToken, ProductPurchase purchase) {
        boolean purchased = purchase.getPurchaseState() == null || purchase.getPurchaseState() == PURCHASED;
        boolean acknowledged = purchase.getAcknowledgementState() != null && purchase.getAcknowledgementState() == ACKNOWLEDGED;
        boolean consumed = purchase.getConsumptionState() != null && purchase.getConsumptionState() == CONSUMED;
        String sku = purchase.getProductId() == null || purchase.getProductId().isBlank() ? productId : purchase.getProductId();
        return new PlayPurchaseRecord(
                sku,
                purchaseToken,
                purchase.getOrderId(),
                purchase.getObfuscatedExternalAccountId(),
                false,
                purchased,
                acknowledged,
                consumed,
                null,
                false);
    }

    private static Instant parseInstant(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return Instant.parse(value);
        } catch (RuntimeException ex) {
            return null;
        }
    }

    private Path credentialsFile() {
        BillingProperties.Google google = properties.google();
        if (google == null || google.credentialsPath() == null || google.credentialsPath().isBlank()) {
            return Path.of("google-play.json");
        }
        Path path = Path.of(google.credentialsPath().trim());
        if (path.isAbsolute()) {
            return path;
        }
        return Path.of(System.getProperty("user.dir", ".")).resolve(path).normalize();
    }

    private String packageName() {
        return properties.google().packageName();
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
