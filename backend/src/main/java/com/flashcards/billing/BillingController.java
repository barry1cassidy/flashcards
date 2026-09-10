package com.flashcards.billing;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.flashcards.auth.AuthService;
import com.flashcards.auth.UserResponse;
import com.flashcards.common.ApiException;
import com.flashcards.security.AuthSupport;
import com.flashcards.user.User;
import com.flashcards.user.UserRepository;

@RestController
@RequestMapping("/api/billing")
public class BillingController {

    private final BillingProperties billingProperties;
    private final UserRepository userRepository;

    public BillingController(BillingProperties billingProperties, UserRepository userRepository) {
        this.billingProperties = billingProperties;
        this.userRepository = userRepository;
    }

    @PostMapping("/stub-pro")
    public UserResponse stubPro(Authentication authentication, @RequestBody(required = false) StubProRequest request) {
        if (!billingProperties.stubEnabled()) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Billing stub is disabled");
        }
        if (request == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Validation failed");
        }
        User user = userRepository
                .findById(AuthSupport.requireUser(authentication).id())
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Not authenticated"));
        AdminAccess.require(user);
        user.setProLicensed(request.proLicensed());
        userRepository.save(user);
        return AuthService.toUserResponse(user);
    }
}
