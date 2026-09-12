package com.flashcards.classroom;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.flashcards.security.AuthSupport;

@RestController
@RequestMapping("/api/join")
public class JoinController {

    private final ClassService classService;

    public JoinController(ClassService classService) {
        this.classService = classService;
    }

    @GetMapping("/{code}")
    public ClassJoinPreview preview(@PathVariable String code) {
        return classService.preview(code);
    }

    @PostMapping("/{code}")
    public ClassDetailResponse join(Authentication authentication, @PathVariable String code) {
        var userId = AuthSupport.requireUser(authentication).id();
        try {
            return classService.join(userId, code);
        } catch (DataIntegrityViolationException ex) {
            return classService.joinedByCode(userId, code);
        }
    }
}
