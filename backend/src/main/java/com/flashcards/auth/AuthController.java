package com.flashcards.auth;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.flashcards.common.ApiException;
import com.flashcards.security.AuthSupport;
import com.flashcards.security.UserPrincipal;
import com.flashcards.user.UserRepository;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final UserRepository userRepository;

    public AuthController(AuthService authService, UserRepository userRepository) {
        this.authService = authService;
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
}
