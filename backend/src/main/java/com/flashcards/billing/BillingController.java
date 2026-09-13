package com.flashcards.billing;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.flashcards.auth.UserResponse;
import com.flashcards.common.ApiException;
import com.flashcards.security.AuthSupport;
import com.flashcards.user.User;
import com.flashcards.user.UserRepository;

@RestController
@RequestMapping("/api/billing")
public class BillingController {

    private final BillingService billingService;
    private final UserRepository userRepository;

    public BillingController(BillingService billingService, UserRepository userRepository) {
        this.billingService = billingService;
        this.userRepository = userRepository;
    }

    @GetMapping("/status")
    public BillingStatusResponse status(Authentication authentication) {
        return billingService.status(AuthSupport.requireUser(authentication).id());
    }

    @PostMapping("/checkout")
    public CheckoutResponse checkout(Authentication authentication, @RequestBody(required = false) CheckoutRequest request) {
        return billingService.createCheckout(
                AuthSupport.requireUser(authentication).id(),
                request == null ? null : request.plan(),
                request == null ? null : request.returnPath());
    }

    @PostMapping("/checkout/complete")
    public UserResponse completeCheckout(
            Authentication authentication, @RequestBody(required = false) CheckoutCompleteRequest request) {
        String sessionId = request == null ? null : request.sessionId();
        return billingService.completeCheckout(AuthSupport.requireUser(authentication).id(), sessionId);
    }

    @PostMapping("/portal")
    public PortalResponse portal(Authentication authentication) {
        return billingService.createPortal(AuthSupport.requireUser(authentication).id());
    }

    @PostMapping("/stripe/webhook")
    public void stripeWebhook(
            @RequestHeader(value = "Stripe-Signature", required = false) String signature,
            @RequestBody byte[] payload) {
        if (signature == null || signature.isBlank() || payload == null || payload.length == 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid Stripe signature");
        }
        billingService.handleStripeWebhook(payload, signature);
    }

    @PostMapping("/stub-pro")
    public UserResponse stubPro(Authentication authentication, @RequestBody(required = false) StubProRequest request) {
        if (request == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Validation failed");
        }
        User user = userRepository
                .findById(AuthSupport.requireUser(authentication).id())
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Not authenticated"));
        AdminAccess.require(user);
        return billingService.stubPro(user.getId(), request.proLicensed());
    }
}
