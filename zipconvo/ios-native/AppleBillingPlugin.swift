import Capacitor
import Foundation
import StoreKit

/// Copy this file into the Xcode App target (same target as Info.plist).
/// It does not register itself. MainViewController.swift must call
/// `registerPluginInstance(AppleBillingPlugin())` or JS gets
/// "AppleBilling plugin is not implemented on ios".
/// Do not finish a consumable until the API has verified the signed transaction.
@objc(AppleBillingPlugin)
public class AppleBillingPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "AppleBillingPlugin"
    public let jsName = "AppleBilling"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "purchase", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "restore", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "entitlements", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "finish", returnType: CAPPluginReturnPromise),
    ]

    @objc func purchase(_ call: CAPPluginCall) {
        let productId = call.getString("productId") ?? ""
        let accountId = call.getString("accountId") ?? ""
        guard !productId.isEmpty else {
            call.reject("Payment failed")
            return
        }
        // StoreKit only presents the purchase sheet from the main thread.
        // A background task returns without a sheet and without an error.
        Task { @MainActor in
            do {
                let products = try await Product.products(for: [productId])
                guard let product = products.first else {
                    self.fail(call, "This subscription is not available in the App Store yet.")
                    return
                }
                var options = Set<Product.PurchaseOption>()
                if let token = UUID(uuidString: accountId) {
                    options.insert(.appAccountToken(token))
                }
                let result = try await product.purchase(options: options)
                switch result {
                case let .success(verification):
                    guard let payload = self.encode(verification) else {
                        self.fail(call, "Payment failed")
                        return
                    }
                    self.ok(call, payload.1)
                case .userCancelled:
                    self.ok(call, ["canceled": true])
                case .pending:
                    self.fail(call, "Payment failed")
                @unknown default:
                    self.fail(call, "Payment failed")
                }
            } catch {
                let message = error.localizedDescription.trimmingCharacters(in: .whitespacesAndNewlines)
                self.fail(call, message.isEmpty ? "Payment failed" : message)
            }
        }
    }

    @objc func restore(_ call: CAPPluginCall) {
        Task {
            do {
                try await AppStore.sync()
            } catch {
                // Still return current entitlements if the sheet is dismissed.
            }
            self.ok(call, ["purchases": await self.collectPurchases()])
        }
    }

    @objc func entitlements(_ call: CAPPluginCall) {
        Task {
            self.ok(call, ["purchases": await self.collectPurchases()])
        }
    }

    @objc func finish(_ call: CAPPluginCall) {
        guard let raw = call.getString("transactionId"), let target = UInt64(raw) else {
            call.resolve()
            return
        }
        Task {
            for await result in Transaction.unfinished {
                if let transaction = try? self.verified(result), transaction.id == target {
                    await transaction.finish()
                    break
                }
            }
            self.ok(call, [:])
        }
    }

    private func collectPurchases() async -> [[String: Any]] {
        var seen = Set<UInt64>()
        var purchases: [[String: Any]] = []
        for await result in Transaction.unfinished {
            guard let transaction = try? verified(result), stillActive(transaction) else {
                continue
            }
            if let item = encode(result), seen.insert(item.0).inserted {
                purchases.append(item.1)
            }
        }
        for await result in Transaction.currentEntitlements {
            if let item = encode(result), seen.insert(item.0).inserted {
                purchases.append(item.1)
            }
        }
        return purchases
    }

    /// Unfinished transactions stay in the queue after a subscription ends.
    /// Android restore only returns purchases that are still active.
    private func stillActive(_ transaction: Transaction) -> Bool {
        if transaction.revocationDate != nil {
            return false
        }
        if let expires = transaction.expirationDate {
            return expires > Date()
        }
        return true
    }

    private func encode(_ result: VerificationResult<Transaction>) -> (UInt64, [String: Any])? {
        guard let transaction = try? verified(result) else {
            return nil
        }
        return (
            transaction.id,
            [
                "productId": transaction.productID,
                "transactionId": String(transaction.id),
                "originalTransactionId": String(transaction.originalID),
                "jwsRepresentation": result.jwsRepresentation,
            ]
        )
    }

    private func verified(_ result: VerificationResult<Transaction>) throws -> Transaction {
        switch result {
        case let .verified(transaction):
            return transaction
        case .unverified:
            throw AppleBillingError.unverified
        }
    }

    private func ok(_ call: CAPPluginCall, _ data: [String: Any]) {
        DispatchQueue.main.async {
            call.resolve(data)
        }
    }

    private func fail(_ call: CAPPluginCall, _ message: String) {
        DispatchQueue.main.async {
            call.reject(message)
        }
    }
}

private enum AppleBillingError: Error {
    case unverified
}
