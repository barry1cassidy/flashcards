package com.flashcards.auth;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.flashcards.billing.AccountDeletionStatus;
import com.flashcards.billing.BillingProvider;
import com.flashcards.billing.BillingService;
import com.flashcards.common.ApiException;
import com.flashcards.user.User;
import com.flashcards.user.UserRepository;

@ExtendWith(MockitoExtension.class)
class AccountServiceTest {

    private static final UUID USER_ID = UUID.fromString("00000000-0000-0000-0000-000000000031");

    @Mock
    private UserRepository userRepository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private AccountCodeService accountCodeService;
    @Mock
    private BillingService billingService;

    private AccountService accountService;

    @BeforeEach
    void setUp() {
        accountService = new AccountService(userRepository, passwordEncoder, accountCodeService, billingService);
    }

    @Test
    void rejectsDeleteWhileStoreSubscriptionIsActive() {
        User user = passwordUser();
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("secret-pass", "hash")).thenReturn(true);
        when(billingService.deletionStatus(USER_ID)).thenReturn(
                new AccountDeletionStatus(false, BillingProvider.APPLE, false, null));

        ApiException ex = assertThrows(ApiException.class, () -> accountService.deleteAccount(
                USER_ID, new DeleteAccountRequest("secret-pass", null)));

        assertEquals(HttpStatus.CONFLICT, ex.getStatus());
        verify(userRepository, never()).delete(any());
    }

    @Test
    void deletesWhenSubscriptionCheckAllowsIt() {
        User user = passwordUser();
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("secret-pass", "hash")).thenReturn(true);
        when(billingService.deletionStatus(USER_ID)).thenReturn(AccountDeletionStatus.permitted());

        accountService.deleteAccount(USER_ID, new DeleteAccountRequest("secret-pass", null));

        verify(userRepository).delete(user);
    }

    @Test
    void confirmEmailChangeUpdatesLogin() {
        User user = passwordUser();
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));
        when(accountCodeService.consume(user, AccountCodePurpose.EMAIL_CHANGE, "123456")).thenReturn("new@example.com");
        when(userRepository.existsByEmail("new@example.com")).thenReturn(false);

        UserResponse response = accountService.confirmEmailChange(USER_ID, "123456");

        assertEquals("new@example.com", user.getEmail());
        assertTrue(user.isEmailVerified());
        assertEquals("new@example.com", response.email());
        verify(userRepository).save(user);
    }

    @Test
    void resetPasswordRequiresTheEmailedCode() {
        User user = passwordUser();
        when(userRepository.findByEmail("student@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.encode("new-password")).thenReturn("new-hash");

        accountService.resetPassword(new ResetPasswordRequest("student@example.com", "123456", "new-password"));

        verify(accountCodeService).consume(eq(user), eq(AccountCodePurpose.PASSWORD_RESET), eq("123456"));
        assertEquals("new-hash", user.getPasswordHash());
    }

    private static User passwordUser() {
        User user = new User();
        user.setId(USER_ID);
        user.setEmail("student@example.com");
        user.setDisplayName("Student");
        user.setPasswordHash("hash");
        user.setEmailVerified(true);
        return user;
    }
}
