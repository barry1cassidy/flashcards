package com.flashcards.auth;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.flashcards.billing.AccountDeletionStatus;
import com.flashcards.common.ApiException;
import com.flashcards.security.AuthSupport;
import com.flashcards.security.UserPrincipal;
import com.flashcards.user.UserRepository;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final AccountService accountService;
    private final UserRepository userRepository;

    public AuthController(AuthService authService, AccountService accountService, UserRepository userRepository) {
        this.authService = authService;
        this.accountService = accountService;
        this.userRepository = userRepository;
    }

    @PostMapping("/register")
    public AuthResponse register(@Valid @RequestBody RegisterRequest request) {
        return authService.register(request);
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @PostMapping("/google")
    public AuthResponse loginWithGoogle(@Valid @RequestBody GoogleLoginRequest request) {
        return authService.loginWithGoogle(request);
    }

    @GetMapping("/me")
    public UserResponse me(Authentication authentication) {
        UserPrincipal principal = AuthSupport.requireUser(authentication);
        return userRepository.findById(principal.id())
                .map(AuthService::toUserResponse)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Not authenticated"));
    }

    @PatchMapping("/me")
    public UserResponse updateMe(Authentication authentication, @Valid @RequestBody UpdateMeRequest request) {
        return authService.updateMe(AuthSupport.requireUser(authentication).id(), request);
    }

    @PostMapping("/verify-email")
    public UserResponse verifyEmail(Authentication authentication, @Valid @RequestBody VerifyEmailRequest request) {
        return authService.verifyEmail(AuthSupport.requireUser(authentication).id(), request.code());
    }

    @PostMapping("/resend-verification")
    public UserResponse resendVerification(Authentication authentication) {
        return authService.resendVerification(AuthSupport.requireUser(authentication).id());
    }

    @PostMapping("/password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void changePassword(Authentication authentication, @Valid @RequestBody ChangePasswordRequest request) {
        accountService.changePassword(AuthSupport.requireUser(authentication).id(), request);
    }

    @PostMapping("/email/request")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void requestEmailChange(Authentication authentication, @Valid @RequestBody EmailChangeRequest request) {
        accountService.requestEmailChange(AuthSupport.requireUser(authentication).id(), request);
    }

    @PostMapping("/email/confirm")
    public UserResponse confirmEmailChange(Authentication authentication, @Valid @RequestBody ConfirmCodeRequest request) {
        return accountService.confirmEmailChange(AuthSupport.requireUser(authentication).id(), request.code());
    }

    @PostMapping("/forgot-password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        accountService.forgotPassword(request.email());
    }

    @PostMapping("/reset-password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        accountService.resetPassword(request);
    }

    @PostMapping("/account/deletion-check")
    public AccountDeletionStatus deletionStatus(Authentication authentication) {
        return accountService.deletionStatus(AuthSupport.requireUser(authentication).id());
    }

    @PostMapping("/account/delete")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteAccount(Authentication authentication, @RequestBody(required = false) DeleteAccountRequest request) {
        accountService.deleteAccount(AuthSupport.requireUser(authentication).id(), request);
    }
}
