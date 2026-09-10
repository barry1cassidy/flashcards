package com.flashcards.auth;

import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.flashcards.common.ApiException;
import com.flashcards.security.JwtService;
import com.flashcards.security.UserPrincipal;
import com.flashcards.user.DeckSort;
import com.flashcards.user.RestudyWait;
import com.flashcards.user.StudyOrder;
import com.flashcards.user.StudyScope;
import com.flashcards.user.Theme;
import com.flashcards.user.User;
import com.flashcards.user.UserLocale;
import com.flashcards.user.UserRepository;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final GoogleTokenService googleTokenService;

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            GoogleTokenService googleTokenService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.googleTokenService = googleTokenService;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String email = request.email().trim().toLowerCase();
        if (userRepository.existsByEmail(email)) {
            throw new ApiException(HttpStatus.CONFLICT, "An account with that email already exists");
        }
        User user = new User();
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setDisplayName(request.displayName().trim());
        user.setTheme(Theme.DARK);
        user.setLocale(UserLocale.fromCode(request.locale()));
        user.setDeckSort(DeckSort.NEWEST);
        user.setStudyOrder(StudyOrder.POSITION);
        user.setStudyScope(StudyScope.DUE_ONLY);
        user.setRestudyWait(RestudyWait.ONE_DAY);
        userRepository.save(user);
        return toAuthResponse(user);
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        String email = request.email().trim().toLowerCase();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Invalid email or password"));
        String hash = user.getPasswordHash();
        if (hash == null || hash.isBlank()) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "This account uses Google sign-in");
        }
        if (!passwordEncoder.matches(request.password(), hash)) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Invalid email or password");
        }
        return toAuthResponse(user);
    }

    @Transactional
    public AuthResponse loginWithGoogle(GoogleLoginRequest request) {
        GoogleTokenService.GoogleProfile profile = googleTokenService.verify(request.idToken());
        String email = profile.email().trim().toLowerCase();
        User user = userRepository.findByGoogleSub(profile.subject())
                .orElseGet(() -> userRepository.findByEmail(email).orElse(null));
        if (user == null) {
            user = new User();
            user.setEmail(email);
            user.setDisplayName(displayNameFrom(profile, email));
            user.setTheme(Theme.DARK);
            user.setLocale(UserLocale.fromCode(request.locale()));
            user.setDeckSort(DeckSort.NEWEST);
            user.setStudyOrder(StudyOrder.POSITION);
            user.setStudyScope(StudyScope.DUE_ONLY);
            user.setRestudyWait(RestudyWait.ONE_DAY);
        } else if (user.getGoogleSub() != null && !user.getGoogleSub().equals(profile.subject())) {
            throw new ApiException(HttpStatus.CONFLICT, "An account with that email already exists");
        } else if (!email.equals(user.getEmail()) && userRepository.existsByEmail(email)) {
            throw new ApiException(HttpStatus.CONFLICT, "An account with that email already exists");
        } else {
            user.setEmail(email);
        }
        user.setGoogleSub(profile.subject());
        userRepository.save(user);
        return toAuthResponse(user);
    }

    @Transactional
    public UserResponse updateMe(UUID userId, UpdateMeRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Not authenticated"));
        if (request.theme() != null) {
            user.setTheme(request.theme());
        }
        if (request.locale() != null) {
            user.setLocale(UserLocale.fromCode(request.locale()));
        }
        if (request.deckSort() != null) {
            user.setDeckSort(request.deckSort());
        }
        if (request.studyOrder() != null) {
            user.setStudyOrder(request.studyOrder());
        }
        if (request.studyScope() != null) {
            user.setStudyScope(request.studyScope());
        }
        if (request.restudyWait() != null) {
            user.setRestudyWait(request.restudyWait());
        }
        return toUserResponse(user);
    }

    private AuthResponse toAuthResponse(User user) {
        UserPrincipal principal = new UserPrincipal(user.getId(), user.getEmail(), user.getDisplayName());
        return new AuthResponse(jwtService.createToken(principal), toUserResponse(user));
    }

    public static UserResponse toUserResponse(User user) {
        Theme theme = user.getTheme() == null ? Theme.DARK : user.getTheme();
        UserLocale locale = user.getLocale() == null ? UserLocale.EN : user.getLocale();
        DeckSort deckSort = user.getDeckSort() == null ? DeckSort.NEWEST : user.getDeckSort();
        StudyOrder studyOrder = user.getStudyOrder() == null ? StudyOrder.POSITION : user.getStudyOrder();
        StudyScope studyScope = user.getStudyScope() == null ? StudyScope.DUE_ONLY : user.getStudyScope();
        RestudyWait restudyWait = user.getRestudyWait() == null ? RestudyWait.ONE_DAY : user.getRestudyWait();
        return new UserResponse(
                user.getId(),
                user.getEmail(),
                user.getDisplayName(),
                theme,
                locale.toCode(),
                deckSort,
                studyOrder,
                studyScope,
                restudyWait,
                user.isProLicensed(),
                user.isAdmin());
    }

    private static String displayNameFrom(GoogleTokenService.GoogleProfile profile, String email) {
        String name = profile.name() == null ? "" : profile.name().trim();
        if (name.isEmpty()) {
            int at = email.indexOf('@');
            name = at > 0 ? email.substring(0, at) : email;
        }
        return name.length() > 100 ? name.substring(0, 100) : name;
    }
}
