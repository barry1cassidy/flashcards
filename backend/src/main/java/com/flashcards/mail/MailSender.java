package com.flashcards.mail;

public interface MailSender {

    void send(String to, String subject, String html, String text);
}
