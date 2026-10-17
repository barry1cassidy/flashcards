package com.flashcards.agent;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.ai.tool.annotation.Tool;
import org.springframework.ai.tool.annotation.ToolParam;

public class AgentEditTools {

    private static final int MAX_TOOL_CALLS = 6;
    private static final int MAX_FIELD_CHARS = 20_000;

    private final Map<UUID, SourceCard> originals;
    private final List<SourceCard> order;
    private final AgentProgress progress;
    private final Map<UUID, AgentCardChange> proposals = new LinkedHashMap<>();

    private int toolCalls;

    public AgentEditTools(List<SourceCard> cards, AgentProgress progress) {
        this.order = List.copyOf(cards);
        this.originals = new LinkedHashMap<>();
        for (SourceCard card : this.order) {
            this.originals.put(card.id(), card);
        }
        this.progress = progress == null ? AgentProgress.noop() : progress;
    }

    public List<AgentCardChange> changes() {
        List<AgentCardChange> changes = new ArrayList<>();
        for (SourceCard card : order) {
            AgentCardChange change = proposals.get(card.id());
            if (change != null) {
                changes.add(change);
            }
        }
        return List.copyOf(changes);
    }

    public int unchangedCount() {
        return originals.size() - proposals.size();
    }

    @Tool(name = "proposeChanges", returnDirect = true, description = """
            Propose text edits for cards in this deck. Call this once with every card that should change.
            Omit cards that should stay the same. Do not invent card ids. Do not add or delete cards.
            front and back must be non-empty. Omit hint to keep the current hint. Pass an empty hint only to remove it.
            A first-letter hint is the first letter of each word on the back, then underscores, with spaces kept.
            """)
    public String proposeChanges(
            @ToolParam(description = "Cards whose text should change. Each item needs cardId, front, and back.")
                    List<ProposedChange> cards) {
        if (++toolCalls > MAX_TOOL_CALLS) {
            progress.step("tooManyTools", String.valueOf(toolCalls));
            return error("Stop. Too many tool calls for this request.");
        }
        int requested = cards == null ? 0 : cards.size();
        progress.step("proposeChanges", requested + " cards");
        if (cards == null || cards.isEmpty()) {
            return error("Propose at least one card that should change, or stop if the instruction does not apply.");
        }
        int accepted = 0;
        int unchanged = 0;
        int unknown = 0;
        int invalid = 0;
        for (ProposedChange change : cards) {
            if (change == null || change.cardId() == null || change.cardId().isBlank()) {
                invalid++;
                continue;
            }
            UUID id;
            try {
                id = UUID.fromString(change.cardId().trim());
            } catch (IllegalArgumentException ex) {
                unknown++;
                continue;
            }
            SourceCard current = originals.get(id);
            if (current == null) {
                unknown++;
                continue;
            }
            String front = clip(change.front());
            String back = clip(change.back());
            if (front.isEmpty() || back.isEmpty()) {
                invalid++;
                continue;
            }
            String hint = change.hint() == null ? norm(current.hint()) : clip(change.hint());
            if (front.equals(norm(current.front())) && back.equals(norm(current.back())) && hint.equals(norm(current.hint()))) {
                proposals.remove(id);
                unchanged++;
                continue;
            }
            proposals.put(id, new AgentCardChange(
                    id,
                    current.position(),
                    current.front(),
                    current.back(),
                    current.hint(),
                    front,
                    back,
                    hint.isEmpty() ? null : hint));
            accepted++;
        }
        if (accepted == 0 && proposals.isEmpty()) {
            return error(
                    "None of those cards changed. Use a real card id, keep front and back non-empty, and only include cards whose text should differ.");
        }
        return "{\"accepted\":" + accepted
                + ",\"unchanged\":" + unchanged
                + ",\"unknown\":" + unknown
                + ",\"invalid\":" + invalid
                + ",\"totalChanges\":" + proposals.size() + "}";
    }

    private static String clip(String value) {
        String trimmed = norm(value);
        return trimmed.length() <= MAX_FIELD_CHARS ? trimmed : trimmed.substring(0, MAX_FIELD_CHARS);
    }

    private static String norm(String value) {
        return value == null ? "" : value.trim();
    }

    private static String error(String message) {
        return "{\"error\":\"" + message.replace("\\", "\\\\").replace("\"", "\\\"") + "\"}";
    }

    public record SourceCard(UUID id, int position, String front, String back, String hint) {
    }

    public record ProposedChange(String cardId, String front, String back, String hint) {
    }
}
