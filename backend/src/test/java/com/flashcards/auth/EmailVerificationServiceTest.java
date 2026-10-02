package com.flashcards.auth;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.flashcards.common.ApiException;
import com.flashcards.mail.MailSender;
import com.flashcards.user.User;
import com.flashcards.user.UserLocale;
import com.flashcards.user.UserRepository;

@ExtendWith(MockitoExtension.class)
class EmailVerificationServiceTest {

    private static final UUID USER_ID = UUID.fromString("00000000-0000-0000-0000-000000000021");

    @Mock
    private EmailVerificationRepository verificationRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private MailSender mailSender;

    private EmailVerificationService service;
    private User user;

    @BeforeEach
    void setUp() {
        service = new EmailVerificationService(verificationRepository, userRepository, passwordEncoder, mailSender);
        user = new User();
        user.setId(USER_ID);
        user.setEmail("new@example.com");
        user.setLocale(UserLocale.EN);
        user.setEmailVerified(false);
    }

    @Test
    void issuesACodeAndSendsMail() {
        when(verificationRepository.findById(USER_ID)).thenReturn(Optional.empty());
        when(passwordEncoder.encode(any())).thenReturn("hash");

        service.issueAndSend(user);

        ArgumentCaptor<String> code = ArgumentCaptor.forClass(String.class);
        verify(passwordEncoder).encode(code.capture());
        assertEquals(6, code.getValue().length());
        verify(mailSender).send(eq("new@example.com"), any(), any(), any());
        verify(verificationRepository).save(any(EmailVerification.class));
    }

    @Test
    void acceptsAMatchingCode() {
        EmailVerification row = new EmailVerification();
        row.setUser(user);
        row.setCodeHash("hash");
        row.setExpiresAt(Instant.now().plusSeconds(60));
        when(verificationRepository.findById(USER_ID)).thenReturn(Optional.of(row));
        when(passwordEncoder.matches("123456", "hash")).thenReturn(true);

        service.verify(user, "123456");

        assertTrue(user.isEmailVerified());
        verify(verificationRepository).delete(row);
    }

    @Test
    void rejectsAWrongCode() {
        EmailVerification row = new EmailVerification();
        row.setUser(user);
        row.setCodeHash("hash");
        row.setExpiresAt(Instant.now().plusSeconds(60));
        when(verificationRepository.findById(USER_ID)).thenReturn(Optional.of(row));
        when(passwordEncoder.matches("000000", "hash")).thenReturn(false);

        ApiException error = assertThrows(ApiException.class, () -> service.verify(user, "000000"));
        assertEquals("That code is wrong or has expired", error.getMessage());
        verify(userRepository, never()).save(any());
    }
}
