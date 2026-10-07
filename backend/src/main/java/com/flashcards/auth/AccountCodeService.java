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

@Service
public class AccountCodeService {

    static final Duration CODE_TTL = Duration.ofMinutes(15);
    static final Duration RESEND_GAP = Duration.ofSeconds(60);
    static final int MAX_ATTEMPTS = 8;

    private static final SecureRandom RANDOM = new SecureRandom();

    private final AccountCodeRepository codeRepository;
    private final PasswordEncoder passwordEncoder;
    private final MailSender mailSender;

    public AccountCodeService(
            AccountCodeRepository codeRepository,
            PasswordEncoder passwordEncoder,
            MailSender mailSender) {
        this.codeRepository = codeRepository;
        this.passwordEncoder = passwordEncoder;
        this.mailSender = mailSender;
    }

    @Transactional
    public void sendPasswordReset(User user) {
        if (!AccountService.hasPassword(user)) {
            sendGoogleNotice(user);
            return;
        }
        String code = issue(user, AccountCodePurpose.PASSWORD_RESET, null);
        boolean spanish = spanish(user);
        String subject = spanish ? "Tu código de Zipdeck es " + code : "Your Zipdeck code is " + code;
        String text = spanish
                ? "Tu código para restablecer la contraseña de Zipdeck es " + code
                        + ". Caduca en 15 minutos. Si no lo pediste, ignora este correo."
                : "Your Zipdeck password reset code is " + code
                        + ". It expires in 15 minutes. If you did not ask for this, ignore this email.";
        mailSender.send(user.getEmail(), subject, "<p>" + escape(text) + "</p>", text);
    }

    @Transactional
    public void sendEmailChange(User user, String newEmail) {
        String code = issue(user, AccountCodePurpose.EMAIL_CHANGE, newEmail);
        boolean spanish = spanish(user);
        String subject = spanish ? "Confirma tu nuevo correo de Zipdeck" : "Confirm your new Zipdeck email";
        String text = spanish
                ? "Tu código para cambiar el correo de Zipdeck a " + newEmail + " es " + code
                        + ". Caduca en 15 minutos. Si no lo pediste, ignora este correo."
                : "Your code to change the Zipdeck email to " + newEmail + " is " + code
                        + ". It expires in 15 minutes. If you did not ask for this, ignore this email.";
        mailSender.send(newEmail, subject, "<p>" + escape(text) + "</p>", text);
    }

    @Transactional
    public String consume(User user, AccountCodePurpose purpose, String rawCode) {
        String code = rawCode == null ? "" : rawCode.trim();
        AccountCode row = codeRepository.findByUser_IdAndPurpose(user.getId(), purpose)
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "That code is wrong or has expired"));
        Instant now = Instant.now();
        if (row.getExpiresAt() == null || row.getExpiresAt().isBefore(now) || row.getAttemptCount() >= MAX_ATTEMPTS) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "That code is wrong or has expired");
        }
        row.setAttemptCount(row.getAttemptCount() + 1);
        if (!passwordEncoder.matches(code, row.getCodeHash())) {
            codeRepository.save(row);
            throw new ApiException(HttpStatus.BAD_REQUEST, "That code is wrong or has expired");
        }
        String payload = row.getPayload();
        codeRepository.delete(row);
        return payload;
    }

    private String issue(User user, AccountCodePurpose purpose, String payload) {
        Instant now = Instant.now();
        AccountCode row = codeRepository.findByUser_IdAndPurpose(user.getId(), purpose).orElseGet(AccountCode::new);
        if (row.getSentAt() != null && row.getSentAt().isAfter(now.minus(RESEND_GAP))) {
            throw new ApiException(HttpStatus.TOO_MANY_REQUESTS, "Wait a minute before requesting another code");
        }
        String code = String.format("%06d", RANDOM.nextInt(1_000_000));
        row.setUser(user);
        row.setPurpose(purpose);
        row.setCodeHash(passwordEncoder.encode(code));
        row.setPayload(payload);
        row.setExpiresAt(now.plus(CODE_TTL));
        row.setSentAt(now);
        row.setAttemptCount(0);
        codeRepository.save(row);
        return code;
    }

    private void sendGoogleNotice(User user) {
        boolean spanish = spanish(user);
        String subject = spanish ? "Tu cuenta de Zipdeck usa Google" : "Your Zipdeck account uses Google";
        String text = spanish
                ? "Esta cuenta de Zipdeck entra con Google, así que no tiene contraseña que restablecer."
                : "This Zipdeck account signs in with Google, so there is no password to reset.";
        mailSender.send(user.getEmail(), subject, "<p>" + escape(text) + "</p>", text);
    }

    private static boolean spanish(User user) {
        return user.getLocale() != null && "es".equals(user.getLocale().toCode());
    }

    private static String escape(String value) {
        return value.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;");
    }
}
