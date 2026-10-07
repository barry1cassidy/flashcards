package com.flashcards.auth;

import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.flashcards.billing.AccountDeletionStatus;
import com.flashcards.billing.BillingService;
import com.flashcards.common.ApiException;
import com.flashcards.user.User;
import com.flashcards.user.UserRepository;

@Service
public class AccountService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AccountCodeService accountCodeService;
    private final BillingService billingService;

    public AccountService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            AccountCodeService accountCodeService,
            BillingService billingService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.accountCodeService = accountCodeService;
        this.billingService = billingService;
    }

    @Transactional
    public void changePassword(UUID userId, ChangePasswordRequest request) {
        User user = requireUser(userId);
        requirePasswordAccount(user);
        if (!passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Current password is wrong");
        }
        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);
    }

    @Transactional
    public void requestEmailChange(UUID userId, EmailChangeRequest request) {
        User user = requireUser(userId);
        requirePasswordAccount(user);
        if (!passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Current password is wrong");
        }
        String email = request.email().trim().toLowerCase();
        if (email.equals(user.getEmail())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "That is already your email");
        }
        if (userRepository.existsByEmail(email)) {
            throw new ApiException(HttpStatus.CONFLICT, "An account with that email already exists");
        }
        accountCodeService.sendEmailChange(user, email);
    }

    @Transactional
    public UserResponse confirmEmailChange(UUID userId, String code) {
        User user = requireUser(userId);
        requirePasswordAccount(user);
        String email = accountCodeService.consume(user, AccountCodePurpose.EMAIL_CHANGE, code);
        if (email == null || email.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "That code is wrong or has expired");
        }
        email = email.trim().toLowerCase();
        if (!email.equals(user.getEmail()) && userRepository.existsByEmail(email)) {
            throw new ApiException(HttpStatus.CONFLICT, "An account with that email already exists");
        }
        user.setEmail(email);
        user.setEmailVerified(true);
        userRepository.save(user);
        return AuthService.toUserResponse(user);
    }

    @Transactional
    public void forgotPassword(String rawEmail) {
        String email = rawEmail == null ? "" : rawEmail.trim().toLowerCase();
        userRepository.findByEmail(email).ifPresent(accountCodeService::sendPasswordReset);
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        String email = request.email().trim().toLowerCase();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "That code is wrong or has expired"));
        requirePasswordAccount(user);
        accountCodeService.consume(user, AccountCodePurpose.PASSWORD_RESET, request.code());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        userRepository.save(user);
    }

    @Transactional
    public AccountDeletionStatus deletionStatus(UUID userId) {
        requireUser(userId);
        return billingService.deletionStatus(userId);
    }

    @Transactional
    public void deleteAccount(UUID userId, DeleteAccountRequest request) {
        User user = requireUser(userId);
        if (user.isAdmin()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Cannot delete an admin account");
        }
        if (hasPassword(user)) {
            String password = request == null ? null : request.password();
            if (password == null || !passwordEncoder.matches(password, user.getPasswordHash())) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Current password is wrong");
            }
        } else {
            String confirmation = request == null || request.confirmation() == null ? "" : request.confirmation().trim();
            if (!confirmation.equalsIgnoreCase(user.getEmail())) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Type your email to confirm");
            }
        }
        AccountDeletionStatus status = billingService.deletionStatus(userId);
        if (!status.allowed()) {
            throw new ApiException(HttpStatus.CONFLICT, "Cancel your subscription before deleting this account");
        }
        userRepository.delete(user);
    }

    static boolean hasPassword(User user) {
        return user.getPasswordHash() != null && !user.getPasswordHash().isBlank();
    }

    private void requirePasswordAccount(User user) {
        if (!hasPassword(user)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "This account uses Google sign-in");
        }
    }

    private User requireUser(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Not authenticated"));
    }
}
