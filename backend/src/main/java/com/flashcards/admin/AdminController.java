package com.flashcards.admin;

import java.util.UUID;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.flashcards.security.AuthSupport;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    @GetMapping("/users")
    public AdminUsersPageResponse users(
            Authentication authentication,
            @RequestParam(name = "q", required = false) String query,
            @RequestParam(name = "pro", required = false, defaultValue = "false") boolean proOnly) {
        return adminService.listUsers(AuthSupport.requireUser(authentication).id(), query, proOnly);
    }

    @GetMapping("/users/{userId}")
    public AdminUserResponse user(Authentication authentication, @PathVariable UUID userId) {
        return adminService.getUser(AuthSupport.requireUser(authentication).id(), userId);
    }

    @PostMapping("/users/{userId}/subscription")
    public AdminUserResponse grantSubscription(
            Authentication authentication, @PathVariable UUID userId, @RequestBody AdminGrantRequest request) {
        return adminService.grantSubscription(
                AuthSupport.requireUser(authentication).id(),
                userId,
                request.plan());
    }

    @PostMapping("/users/{userId}/subscription/cancel")
    public AdminUserResponse cancelSubscription(Authentication authentication, @PathVariable UUID userId) {
        return adminService.cancelSubscription(AuthSupport.requireUser(authentication).id(), userId);
    }

    @DeleteMapping("/users/{userId}")
    public void deleteUser(Authentication authentication, @PathVariable UUID userId) {
        adminService.deleteUser(AuthSupport.requireUser(authentication).id(), userId);
    }
}
