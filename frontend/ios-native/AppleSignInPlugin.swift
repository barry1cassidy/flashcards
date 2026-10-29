import AuthenticationServices
import Capacitor
import UIKit

/// Copy this file into the Xcode App target (same target as Info.plist).
/// It does not register itself. MainViewController.swift must call
/// `registerPluginInstance(AppleSignInPlugin())` or JS gets
/// "AppleSignIn plugin is not implemented on ios".
@objc(AppleSignInPlugin)
public class AppleSignInPlugin: CAPPlugin, CAPBridgedPlugin, ASAuthorizationControllerDelegate,
    ASAuthorizationControllerPresentationContextProviding
{
    public let identifier = "AppleSignInPlugin"
    public let jsName = "AppleSignIn"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "signIn", returnType: CAPPluginReturnPromise)
    ]

    private var pendingCall: CAPPluginCall?
    private var authController: ASAuthorizationController?

    @objc func signIn(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            self.pendingCall = call
            let request = ASAuthorizationAppleIDProvider().createRequest()
            request.requestedScopes = [.fullName, .email]
            let controller = ASAuthorizationController(authorizationRequests: [request])
            controller.delegate = self
            controller.presentationContextProvider = self
            self.authController = controller
            controller.performRequests()
        }
    }

    public func presentationAnchor(for controller: ASAuthorizationController) -> ASPresentationAnchor {
        if let window = bridge?.webView?.window {
            return window
        }
        if let scene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
            let window = scene.windows.first(where: \.isKeyWindow) ?? scene.windows.first
        {
            return window
        }
        return ASPresentationAnchor()
    }

    public func authorizationController(
        controller: ASAuthorizationController,
        didCompleteWithAuthorization authorization: ASAuthorization
    ) {
        defer { clear() }
        guard let call = pendingCall else {
            return
        }
        guard let credential = authorization.credential as? ASAuthorizationAppleIDCredential else {
            fail(call, "Invalid Apple sign-in")
            return
        }
        guard let tokenData = credential.identityToken,
            let identityToken = String(data: tokenData, encoding: .utf8),
            !identityToken.isEmpty
        else {
            fail(call, "Invalid Apple sign-in")
            return
        }
        var payload: [String: Any] = ["identityToken": identityToken]
        if let email = credential.email, !email.isEmpty {
            payload["email"] = email
        }
        let name = PersonNameComponentsFormatter.localizedString(
            from: credential.fullName ?? PersonNameComponents(),
            style: .default
        ).trimmingCharacters(in: .whitespacesAndNewlines)
        if !name.isEmpty {
            payload["fullName"] = name
        }
        ok(call, payload)
    }

    public func authorizationController(
        controller: ASAuthorizationController,
        didCompleteWithError error: Error
    ) {
        defer { clear() }
        guard let call = pendingCall else {
            return
        }
        let code = (error as NSError).code
        if code == ASAuthorizationError.canceled.rawValue || code == ASAuthorizationError.unknown.rawValue {
            ok(call, ["canceled": true])
            return
        }
        let message = error.localizedDescription.trimmingCharacters(in: .whitespacesAndNewlines)
        fail(call, message.isEmpty ? "Invalid Apple sign-in" : message)
    }

    private func clear() {
        pendingCall = nil
        authController = nil
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
