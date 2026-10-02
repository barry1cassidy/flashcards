package com.flashcards.share;

import java.util.UUID;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.flashcards.security.AuthSupport;
import com.flashcards.security.UserPrincipal;

@RestController
@RequestMapping("/api/shares")
public class ShareController {

    private final ShareService shareService;

    public ShareController(ShareService shareService) {
        this.shareService = shareService;
    }

    @GetMapping("/{code}")
    public SharePreviewResponse preview(Authentication authentication, @PathVariable String code) {
        return shareService.preview(code, viewerId(authentication));
    }

    @PostMapping("/{code}/copy")
    public ShareAcceptResponse copy(Authentication authentication, @PathVariable String code) {
        return shareService.accept(AuthSupport.requireUser(authentication).id(), code);
    }

    private static UUID viewerId(Authentication authentication) {
        if (authentication != null && authentication.getPrincipal() instanceof UserPrincipal principal) {
            return principal.id();
        }
        return null;
    }
}
