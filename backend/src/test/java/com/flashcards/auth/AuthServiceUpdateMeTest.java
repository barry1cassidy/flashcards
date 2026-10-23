package com.flashcards.auth;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
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

import com.flashcards.common.ApiException;
import com.flashcards.security.JwtService;
import com.flashcards.user.ListenSideFirst;
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
                new UpdateMeRequest(null, null, null, null, null, null, true, null, null, null, null, null, null, null, null));

        assertTrue(user.isTeacherMode());
        assertTrue(response.teacherMode());
    }

    @Test
    void savesListenDefaults() {
        User user = listener();
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));

        UserResponse response = authService.updateMe(
                USER_ID,
                new UpdateMeRequest(null, null, null, null, null, null, null, null, 12, ListenSideFirst.BACK, true, false, 30, 1.25, true));

        assertEquals(12, user.getListenPauseSeconds());
        assertEquals(ListenSideFirst.BACK, user.getListenSideFirst());
        assertTrue(user.isListenRepeat());
        assertFalse(user.isListenAnnounce());
        assertEquals(30, user.getListenSleepMinutes());
        assertEquals(1.25, user.getListenSpeechRate(), 1e-6);
        assertTrue(user.isListenQuestionTwice());
        assertEquals(12, response.listenPauseSeconds());
        assertEquals(30, response.listenSleepMinutes());
        assertEquals(1.25, response.listenSpeechRate(), 1e-6);
        assertTrue(response.listenQuestionTwice());
    }

    @Test
    void rejectsASleepTimerOutsideTheChoices() {
        User user = listener();
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));

        assertThrows(ApiException.class, () -> authService.updateMe(
                USER_ID,
                new UpdateMeRequest(null, null, null, null, null, null, null, null, 4, null, null, null, 20, null, null)));
        assertEquals(0, user.getListenSleepMinutes());
    }

    @Test
    void rejectsASpeechRateOutsideTheRange() {
        User user = listener();
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));

        assertThrows(ApiException.class, () -> authService.updateMe(
                USER_ID,
                new UpdateMeRequest(null, null, null, null, null, null, null, null, null, null, null, null, null, 1.5, null)));
        assertEquals(1.0, user.getListenSpeechRate(), 1e-6);
    }

    private static User listener() {
        User user = new User();
        user.setId(USER_ID);
        user.setEmail("student@example.com");
        user.setDisplayName("Student");
        return user;
    }
}
