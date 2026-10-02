package com.flashcards.mail;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import com.flashcards.common.ApiException;

import tools.jackson.databind.ObjectMapper;

@Service
public class ResendMailSender implements MailSender {

    private static final Logger log = LoggerFactory.getLogger(ResendMailSender.class);
    private static final URI EMAILS = URI.create("https://api.resend.com/emails");

    private final MailProperties properties;
    private final ObjectMapper json;
    private final HttpClient http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();

    public ResendMailSender(MailProperties properties, ObjectMapper json) {
        this.properties = properties;
        this.json = json;
    }

    @Override
    public void send(String to, String subject, String html, String text) {
        if (!properties.enabled()) {
            log.warn("Skipped email to {} because RESEND_API_KEY is not set", redact(to));
            return;
        }
        try {
            String body = json.writeValueAsString(Map.of(
                    "from", properties.fromHeader(),
                    "to", new String[] { to },
                    "subject", subject,
                    "html", html,
                    "text", text));
            HttpRequest request = HttpRequest.newBuilder(EMAILS)
                    .timeout(Duration.ofSeconds(15))
                    .header("Authorization", "Bearer " + properties.resendApiKey().trim())
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(body, StandardCharsets.UTF_8))
                    .build();
            HttpResponse<String> response = http.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
            if (response.statusCode() >= 300) {
                log.warn("Resend rejected email to {} ({})", redact(to), response.statusCode());
                throw new ApiException(HttpStatus.BAD_GATEWAY, "Could not send email");
            }
        } catch (ApiException ex) {
            throw ex;
        } catch (IOException | InterruptedException ex) {
            if (ex instanceof InterruptedException) {
                Thread.currentThread().interrupt();
            }
            log.warn("Resend request failed for {}", redact(to));
            throw new ApiException(HttpStatus.BAD_GATEWAY, "Could not send email");
        }
    }

    private static String redact(String email) {
        if (email == null || !email.contains("@")) {
            return "(none)";
        }
        return "***@" + email.substring(email.indexOf('@') + 1);
    }
}
