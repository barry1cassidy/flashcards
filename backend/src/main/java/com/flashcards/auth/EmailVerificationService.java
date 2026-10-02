package com.flashcards.auth;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.flashcards.common.ApiException;
import com.flashcards.mail.MailSender;
import com.flashcards.user.User;
import com.flashcards.user.UserRepository;

@Service
public class EmailVerificationService {

    static final Duration CODE_TTL = Duration.ofMinutes(15);
    static final Duration RESEND_GAP = Duration.ofSeconds(60);
    static final int MAX_ATTEMPTS = 8;

    private static final SecureRandom RANDOM = new SecureRandom();

    private final EmailVerificationRepository verificationRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final MailSender mailSender;

    public EmailVerificationService(
            EmailVerificationRepository verificationRepository,
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            MailSender mailSender) {
        this.verificationRepository = verificationRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.mailSender = mailSender;
    }

    @Transactional
    public void issueAndSend(User user) {
        if (user == null || user.isEmailVerified()) {
            return;
        }
        Instant now = Instant.now();
        EmailVerification row = verificationRepository.findById(user.getId()).orElseGet(EmailVerification::new);
        if (row.getSentAt() != null && row.getSentAt().isAfter(now.minus(RESEND_GAP))) {
            throw new ApiException(HttpStatus.TOO_MANY_REQUESTS, "Wait a minute before requesting another code");
        }
        String code = newCode();
        row.setUser(user);
        row.setCodeHash(passwordEncoder.encode(code));
        row.setExpiresAt(now.plus(CODE_TTL));
        row.setSentAt(now);
        row.setAttemptCount(0);
        verificationRepository.save(row);
        sendCode(user, code);
    }

    @Transactional
    public void verify(User user, String rawCode) {
        if (user.isEmailVerified()) {
            return;
        }
        String code = rawCode == null ? "" : rawCode.trim();
        EmailVerification row = verificationRepository.findById(user.getId())
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "That code is wrong or has expired"));
        Instant now = Instant.now();
        if (row.getExpiresAt() == null || row.getExpiresAt().isBefore(now)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "That code is wrong or has expired");
        }
        if (row.getAttemptCount() >= MAX_ATTEMPTS) {
            throw new ApiException(HttpStatus.TOO_MANY_REQUESTS, "That code is wrong or has expired");
        }
        row.setAttemptCount(row.getAttemptCount() + 1);
        if (!passwordEncoder.matches(code, row.getCodeHash())) {
            verificationRepository.save(row);
            throw new ApiException(HttpStatus.BAD_REQUEST, "That code is wrong or has expired");
        }
        user.setEmailVerified(true);
        userRepository.save(user);
        verificationRepository.delete(row);
    }

    private void sendCode(User user, String code) {
        boolean spanish = user.getLocale() != null && "es".equals(user.getLocale().toCode());
        String subject = spanish ? "Tu código de Zipdeck es " + code : "Your Zipdeck code is " + code;
        String text = spanish
                ? "Tu código de Zipdeck es " + code + ". Caduca en 15 minutos. Si no creaste esta cuenta, ignora este correo."
                : "Your Zipdeck code is " + code + ". It expires in 15 minutes. If you did not create this account, ignore this email.";
        String html = "<p>" + escape(text) + "</p>";
        mailSender.send(user.getEmail(), subject, html, text);
    }

    static String newCode() {
        return String.format("%06d", RANDOM.nextInt(1_000_000));
    }

    private static String escape(String value) {
        return value.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;");
    }
}
