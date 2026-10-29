package com.flashcards.auth;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.flashcards.common.ApiException;
import com.flashcards.security.JwtService;
import com.flashcards.user.User;
import com.flashcards.user.UserRepository;

@ExtendWith(MockitoExtension.class)
class AuthServiceAppleTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private JwtService jwtService;
    @Mock
    private GoogleTokenService googleTokenService;
    @Mock
    private AppleTokenService appleTokenService;
    @Mock
    private EmailVerificationService emailVerificationService;

    private AuthService authService;

    @BeforeEach
    void setUp() {
        authService = new AuthService(
                userRepository,
                passwordEncoder,
                jwtService,
                googleTokenService,
                appleTokenService,
                emailVerificationService);
    }

    @Test
    void createsAccountFromAppleProfile() {
        when(appleTokenService.verify("id-token"))
                .thenReturn(new AppleTokenService.AppleProfile("apple-1", "hide@privaterelay.appleid.com"));
        when(userRepository.findByAppleSub("apple-1")).thenReturn(Optional.empty());
        when(userRepository.findByEmail("hide@privaterelay.appleid.com")).thenReturn(Optional.empty());
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User user = invocation.getArgument(0);
            user.setId(java.util.UUID.fromString("00000000-0000-0000-0000-000000000019"));
            return user;
        });
        when(jwtService.createToken(any())).thenReturn("jwt");

        AuthResponse response = authService.loginWithApple(new AppleLoginRequest("id-token", "en", "Barry Cassidy"));

        assertEquals("jwt", response.token());
        assertEquals("hide@privaterelay.appleid.com", response.user().email());
        assertEquals("Barry Cassidy", response.user().displayName());
        assertTrue(response.user().appleSignIn());
        ArgumentCaptor<User> saved = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(saved.capture());
        assertEquals("apple-1", saved.getValue().getAppleSub());
        assertTrue(saved.getValue().isEmailVerified());
    }

    @Test
    void linksAppleToExistingEmailAccount() {
        User existing = new User();
        existing.setId(java.util.UUID.fromString("00000000-0000-0000-0000-000000000023"));
        existing.setEmail("barry@gmail.com");
        existing.setDisplayName("Existing");
        existing.setPasswordHash("hash");
        when(appleTokenService.verify("id-token"))
                .thenReturn(new AppleTokenService.AppleProfile("apple-1", "Barry@gmail.com"));
        when(userRepository.findByAppleSub("apple-1")).thenReturn(Optional.empty());
        when(userRepository.findByEmail("barry@gmail.com")).thenReturn(Optional.of(existing));
        when(userRepository.save(existing)).thenReturn(existing);
        when(jwtService.createToken(any())).thenReturn("jwt");

        AuthResponse response = authService.loginWithApple(new AppleLoginRequest("id-token", "en", "Barry"));

        assertEquals("Existing", response.user().displayName());
        assertEquals("apple-1", existing.getAppleSub());
        assertTrue(response.user().appleSignIn());
    }

    @Test
    void returningAppleUserDoesNotNeedEmailInToken() {
        User existing = new User();
        existing.setId(java.util.UUID.fromString("00000000-0000-0000-0000-000000000024"));
        existing.setEmail("hide@privaterelay.appleid.com");
        existing.setDisplayName("Barry");
        existing.setAppleSub("apple-1");
        when(appleTokenService.verify("id-token"))
                .thenReturn(new AppleTokenService.AppleProfile("apple-1", null));
        when(userRepository.findByAppleSub("apple-1")).thenReturn(Optional.of(existing));
        when(userRepository.save(existing)).thenReturn(existing);
        when(jwtService.createToken(any())).thenReturn("jwt");

        AuthResponse response = authService.loginWithApple(new AppleLoginRequest("id-token", "en", null));

        assertEquals("hide@privaterelay.appleid.com", response.user().email());
        assertEquals("apple-1", existing.getAppleSub());
    }

    @Test
    void firstAppleLoginWithoutEmailFails() {
        when(appleTokenService.verify("id-token"))
                .thenReturn(new AppleTokenService.AppleProfile("apple-1", null));
        when(userRepository.findByAppleSub("apple-1")).thenReturn(Optional.empty());

        ApiException error = assertThrows(
                ApiException.class, () -> authService.loginWithApple(new AppleLoginRequest("id-token", "en", null)));
        assertEquals("Invalid Apple sign-in", error.getMessage());
    }

    @Test
    void passwordLoginRejectsAppleOnlyAccount() {
        User user = new User();
        user.setEmail("hide@privaterelay.appleid.com");
        user.setAppleSub("apple-1");
        when(userRepository.findByEmail("hide@privaterelay.appleid.com")).thenReturn(Optional.of(user));

        ApiException error = assertThrows(
                ApiException.class,
                () -> authService.login(new LoginRequest("hide@privaterelay.appleid.com", "password1")));
        assertEquals("This account uses Sign in with Apple", error.getMessage());
    }
}
