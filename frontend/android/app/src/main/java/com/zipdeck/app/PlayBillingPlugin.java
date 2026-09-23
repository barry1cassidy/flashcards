package com.zipdeck.app;

import androidx.annotation.NonNull;

import com.android.billingclient.api.BillingClient;
import com.android.billingclient.api.BillingClientStateListener;
import com.android.billingclient.api.BillingFlowParams;
import com.android.billingclient.api.BillingResult;
import com.android.billingclient.api.PendingPurchasesParams;
import com.android.billingclient.api.ProductDetails;
import com.android.billingclient.api.Purchase;
import com.android.billingclient.api.QueryProductDetailsParams;
import com.android.billingclient.api.QueryProductDetailsResult;
import com.android.billingclient.api.QueryPurchasesParams;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.util.List;
import java.util.function.Consumer;

@CapacitorPlugin(name = "PlayBilling")
public class PlayBillingPlugin extends Plugin {

    private BillingClient billingClient;
    private PluginCall pendingPurchase;

    @Override
    public void load() {
        billingClient = BillingClient.newBuilder(getContext())
                .setListener(this::onPurchasesUpdated)
                .enablePendingPurchases(PendingPurchasesParams.newBuilder().enableOneTimeProducts().build())
                .enableAutoServiceReconnection()
                .build();
    }

    @PluginMethod
    public void purchase(PluginCall call) {
        String productId = call.getString("productId", "");
        String productType = call.getString("productType", BillingClient.ProductType.SUBS);
        String accountId = call.getString("accountId", "");
        if (productId == null || productId.isBlank()) {
            call.reject("Payment failed");
            return;
        }
        String type = BillingClient.ProductType.INAPP.equals(productType)
                ? BillingClient.ProductType.INAPP
                : BillingClient.ProductType.SUBS;
        ensureConnected(call, () -> startPurchase(call, productId, type, accountId == null ? "" : accountId));
    }

    @PluginMethod
    public void restore(PluginCall call) {
        ensureConnected(call, () -> queryPurchases(call, BillingClient.ProductType.SUBS, new JSArray(), (subs) ->
                queryPurchases(call, BillingClient.ProductType.INAPP, subs, (all) -> {
                    JSObject result = new JSObject();
                    result.put("purchases", all);
                    call.resolve(result);
                })));
    }

    private void startPurchase(PluginCall call, String productId, String productType, String accountId) {
        QueryProductDetailsParams params = QueryProductDetailsParams.newBuilder()
                .setProductList(List.of(QueryProductDetailsParams.Product.newBuilder()
                        .setProductId(productId)
                        .setProductType(productType)
                        .build()))
                .build();
        billingClient.queryProductDetailsAsync(params, (BillingResult result, QueryProductDetailsResult detailsResult) -> {
            if (result.getResponseCode() != BillingClient.BillingResponseCode.OK) {
                call.reject("Payment failed");
                return;
            }
            List<ProductDetails> detailsList =
                    detailsResult == null ? List.of() : detailsResult.getProductDetailsList();
            if (detailsList == null || detailsList.isEmpty()) {
                call.reject("Payment failed");
                return;
            }
            ProductDetails details = detailsList.get(0);
            BillingFlowParams.ProductDetailsParams.Builder item =
                    BillingFlowParams.ProductDetailsParams.newBuilder().setProductDetails(details);
            if (BillingClient.ProductType.SUBS.equals(details.getProductType())) {
                List<ProductDetails.SubscriptionOfferDetails> offers = details.getSubscriptionOfferDetails();
                if (offers == null || offers.isEmpty()) {
                    call.reject("Payment failed");
                    return;
                }
                item.setOfferToken(offers.get(0).getOfferToken());
            }
            BillingFlowParams.Builder flow = BillingFlowParams.newBuilder()
                    .setProductDetailsParamsList(List.of(item.build()));
            if (!accountId.isBlank()) {
                flow.setObfuscatedAccountId(accountId);
            }
            pendingPurchase = call;
            getActivity().runOnUiThread(() -> {
                BillingResult launch = billingClient.launchBillingFlow(getActivity(), flow.build());
                if (launch.getResponseCode() != BillingClient.BillingResponseCode.OK) {
                    pendingPurchase = null;
                    call.reject("Payment failed");
                }
            });
        });
    }

    private void onPurchasesUpdated(BillingResult result, List<Purchase> purchases) {
        PluginCall call = pendingPurchase;
        if (call == null) {
            return;
        }
        pendingPurchase = null;
        int code = result.getResponseCode();
        if (code == BillingClient.BillingResponseCode.USER_CANCELED) {
            JSObject canceled = new JSObject();
            canceled.put("canceled", true);
            call.resolve(canceled);
            return;
        }
        if (code != BillingClient.BillingResponseCode.OK || purchases == null || purchases.isEmpty()) {
            call.reject("Payment failed");
            return;
        }
        Purchase purchase = purchases.get(0);
        if (purchase.getPurchaseState() != Purchase.PurchaseState.PURCHASED) {
            call.reject("Payment failed");
            return;
        }
        call.resolve(toJson(purchase));
    }

    private void queryPurchases(PluginCall call, String productType, JSArray collected, Consumer<JSArray> done) {
        QueryPurchasesParams params =
                QueryPurchasesParams.newBuilder().setProductType(productType).build();
        billingClient.queryPurchasesAsync(params, (BillingResult result, List<Purchase> purchases) -> {
            if (result.getResponseCode() != BillingClient.BillingResponseCode.OK) {
                call.reject("Payment failed");
                return;
            }
            if (purchases != null) {
                for (Purchase purchase : purchases) {
                    if (purchase.getPurchaseState() == Purchase.PurchaseState.PURCHASED) {
                        collected.put(toJson(purchase));
                    }
                }
            }
            done.accept(collected);
        });
    }

    private static JSObject toJson(Purchase purchase) {
        JSObject json = new JSObject();
        json.put("canceled", false);
        List<String> products = purchase.getProducts();
        json.put("productId", products == null || products.isEmpty() ? "" : products.get(0));
        json.put("purchaseToken", purchase.getPurchaseToken());
        json.put("orderId", purchase.getOrderId() == null ? "" : purchase.getOrderId());
        return json;
    }

    private void ensureConnected(PluginCall call, Runnable next) {
        if (billingClient.isReady()) {
            next.run();
            return;
        }
        billingClient.startConnection(new BillingClientStateListener() {
            @Override
            public void onBillingSetupFinished(@NonNull BillingResult billingResult) {
                if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.OK) {
                    next.run();
                } else {
                    call.reject("Billing is not configured");
                }
            }

            @Override
            public void onBillingServiceDisconnected() {
                // Auto-reconnect is enabled in Billing Library 8.
            }
        });
    }
}
