package com.flashcards.studio;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

import org.springframework.http.HttpStatus;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.flashcards.common.ApiException;

final class LanguageStudioDraftParser {

    static final int MIN_TURNS = 6;
    static final int MAX_TURNS = 12;
    private static final int MAX_TITLE = 120;
    private static final int MAX_ROLE = 80;
    private static final int MAX_LINE = 400;
    private static final ObjectMapper JSON = new ObjectMapper();

    private LanguageStudioDraftParser() {
    }

    static LanguageStudioDraft parse(String raw) {
        JsonNode root;
        try {
            root = JSON.readTree(extractJson(raw));
        } catch (ApiException ex) {
            throw ex;
        } catch (Exception ex) {
            throw failed();
        }
        if (root == null || !root.isObject()) {
            throw failed();
        }
        String title = text(root, "title");
        String yourRole = text(root, "yourRole");
        String theirRole = text(root, "theirRole");
        JsonNode turnsNode = root.get("turns");
        if (turnsNode == null || !turnsNode.isArray()) {
            throw failed();
        }
        List<LanguageStudioDraft.Turn> turns = new ArrayList<>();
        int youTurns = 0;
        for (JsonNode node : turnsNode) {
            if (node == null || !node.isObject()) {
                continue;
            }
            LanguageTurnRole role = LanguageTurnRole.from(text(node, "role"));
            String speaker = clip(text(node, "speaker"), MAX_ROLE);
            String nativeText = clip(firstText(node, "native", "nativeText"), MAX_LINE);
            String targetText = clip(firstText(node, "target", "targetText"), MAX_LINE);
            if (speaker.isBlank() || nativeText.isBlank() || targetText.isBlank()) {
                continue;
            }
            if (role == LanguageTurnRole.YOU) {
                youTurns++;
            }
            turns.add(new LanguageStudioDraft.Turn(role, speaker, nativeText, targetText));
            if (turns.size() == MAX_TURNS) {
                break;
            }
        }
        if (turns.size() < MIN_TURNS || youTurns < 2) {
            throw failed();
        }
        return new LanguageStudioDraft(
                clip(title.isBlank() ? "Conversation" : title, MAX_TITLE),
                clip(yourRole.isBlank() ? "You" : yourRole, MAX_ROLE),
                clip(theirRole.isBlank() ? "Them" : theirRole, MAX_ROLE),
                List.copyOf(turns));
    }

    static String extractJson(String raw) {
        if (raw == null || raw.isBlank()) {
            throw failed();
        }
        String trimmed = raw.trim();
        if (trimmed.startsWith("```")) {
            int newline = trimmed.indexOf('\n');
            int end = trimmed.lastIndexOf("```");
            if (newline > 0 && end > newline) {
                trimmed = trimmed.substring(newline + 1, end).trim();
            }
        }
        int start = trimmed.indexOf('{');
        int last = trimmed.lastIndexOf('}');
        if (start < 0 || last <= start) {
            throw failed();
        }
        return trimmed.substring(start, last + 1);
    }

    private static String firstText(JsonNode node, String... names) {
        for (String name : names) {
            String value = text(node, name);
            if (!value.isBlank()) {
                return value;
            }
        }
        return "";
    }

    private static String text(JsonNode node, String name) {
        JsonNode value = node.get(name);
        if (value == null || value.isNull()) {
            return "";
        }
        return value.asText("").trim().replaceAll("\\s+", " ");
    }

    private static String clip(String value, int max) {
        String trimmed = value == null ? "" : value.trim();
        if (trimmed.length() <= max) {
            return trimmed;
        }
        return trimmed.substring(0, max).trim();
    }

    private static ApiException failed() {
        return new ApiException(
                HttpStatus.BAD_REQUEST, "The AI did not create a conversation. You were not charged.");
    }

    static String levelHint(LanguageLevel level) {
        return switch (level) {
            case A1 -> "A1: very short present-tense sentences, greetings, and concrete words.";
            case A2 -> "A2: everyday errands with short, clear sentences.";
            case B1 -> "B1: connected sentences, a little opinion, still easy to follow aloud.";
            case B2 -> "B2: natural pace, some idiom, still a spoken scene not an essay.";
            case C1 -> "C1: fluent, precise, natural register for the setting.";
        };
    }

    static String scenarioLabel(String scenario) {
        if (scenario == null) {
            return "everyday conversation";
        }
        return switch (scenario.toLowerCase(Locale.ROOT)) {
            case "cafe" -> "ordering in a cafe";
            case "airport" -> "at the airport";
            case "doctor" -> "at the doctor";
            case "hotel" -> "checking into a hotel";
            case "pharmacy" -> "at the pharmacy";
            case "interview" -> "a first job interview";
            case "custom" -> "a custom scene";
            default -> scenario.replace('_', ' ').trim();
        };
    }
}
