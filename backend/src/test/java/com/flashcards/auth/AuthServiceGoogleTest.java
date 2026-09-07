package com.flashcards.auth;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
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
class AuthServiceGoogleTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private JwtService jwtService;
    @Mock
    private GoogleTokenService googleTokenService;

    private AuthService authService;

    @BeforeEach
    void setUp() {
        authService = new AuthService(userRepository, passwordEncoder, jwtService, googleTokenService);
    }

    @Test
    void createsAccountFromGoogleProfile() {
        when(googleTokenService.verify("id-token"))
                .thenReturn(new GoogleTokenService.GoogleProfile("sub-1", "barry@gmail.com", "Barry"));
        when(userRepository.findByGoogleSub("sub-1")).thenReturn(Optional.empty());
        when(userRepository.findByEmail("barry@gmail.com")).thenReturn(Optional.empty());
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User user = invocation.getArgument(0);
            user.setId(java.util.UUID.fromString("00000000-0000-0000-0000-000000000009"));
            return user;
        });
        when(jwtService.createToken(any())).thenReturn("jwt");

        AuthResponse response = authService.loginWithGoogle(new GoogleLoginRequest("id-token", "es"));

        assertEquals("jwt", response.token());
        assertEquals("barry@gmail.com", response.user().email());
        assertEquals("Barry", response.user().displayName());
        assertEquals("es", response.user().locale());
        ArgumentCaptor<User> saved = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(saved.capture());
        assertEquals("sub-1", saved.getValue().getGoogleSub());
    }

    @Test
    void linksGoogleToExistingEmailAccount() {
        User existing = new User();
        existing.setId(java.util.UUID.fromString("00000000-0000-0000-0000-000000000003"));
        existing.setEmail("barry@gmail.com");
        existing.setDisplayName("Existing");
        existing.setPasswordHash("hash");
        when(googleTokenService.verify("id-token"))
                .thenReturn(new GoogleTokenService.GoogleProfile("sub-1", "Barry@gmail.com", "Barry Cassidy"));
        when(userRepository.findByGoogleSub("sub-1")).thenReturn(Optional.empty());
        when(userRepository.findByEmail("barry@gmail.com")).thenReturn(Optional.of(existing));
        when(userRepository.save(existing)).thenReturn(existing);
        when(jwtService.createToken(any())).thenReturn("jwt");

        AuthResponse response = authService.loginWithGoogle(new GoogleLoginRequest("id-token", "en"));

        assertEquals("Existing", response.user().displayName());
        assertEquals("sub-1", existing.getGoogleSub());
    }

    @Test
    void passwordLoginRejectsGoogleOnlyAccount() {
        User user = new User();
        user.setEmail("barry@gmail.com");
        user.setGoogleSub("sub-1");
        when(userRepository.findByEmail("barry@gmail.com")).thenReturn(Optional.of(user));

        ApiException error = assertThrows(
                ApiException.class,
                () -> authService.login(new LoginRequest("barry@gmail.com", "password1")));
        assertEquals("This account uses Google sign-in", error.getMessage());
    }
}
