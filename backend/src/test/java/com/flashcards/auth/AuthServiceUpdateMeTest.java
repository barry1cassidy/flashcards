package com.flashcards.auth;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.flashcards.security.JwtService;
import com.flashcards.user.User;
import com.flashcards.user.UserRepository;

@ExtendWith(MockitoExtension.class)
class AuthServiceUpdateMeTest {

    private static final UUID USER_ID = UUID.fromString("00000000-0000-0000-0000-000000000021");

    @Mock
    private UserRepository userRepository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private JwtService jwtService;
    @Mock
    private GoogleTokenService googleTokenService;
    @Mock
    private EmailVerificationService emailVerificationService;

    private AuthService authService;

    @BeforeEach
    void setUp() {
        authService = new AuthService(
                userRepository, passwordEncoder, jwtService, googleTokenService, emailVerificationService);
    }

    @Test
    void letsAnyUserEnableTeacherMode() {
        User user = new User();
        user.setId(USER_ID);
        user.setEmail("student@example.com");
        user.setDisplayName("Student");
        user.setAdmin(false);
        user.setTeacherMode(false);
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));

        UserResponse response = authService.updateMe(
                USER_ID,
                new UpdateMeRequest(null, null, null, null, null, null, true));

        assertTrue(user.isTeacherMode());
        assertTrue(response.teacherMode());
    }
}
