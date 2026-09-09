package com.flashcards.agent;

import java.util.List;
import java.util.StringJoiner;
import java.util.UUID;

import org.springframework.ai.tool.annotation.Tool;
import org.springframework.ai.tool.annotation.ToolParam;

import com.flashcards.card.CardDraft;
import com.flashcards.card.CardLanguages;
import com.flashcards.card.CardService;
import com.flashcards.common.ApiException;
import com.flashcards.deck.DeckRequest;
import com.flashcards.deck.DeckResponse;
import com.flashcards.deck.DeckService;
import com.flashcards.group.GroupRequest;
import com.flashcards.group.GroupResponse;
import com.flashcards.group.GroupService;

public class AgentTools {

    private static final String DEFAULT_SET_COLOR = "#4C6FFF";
    private static final int MAX_TOOL_CALLS = 12;

    private final UUID userId;
    private final UUID preferredSetId;
    private final int maxCards;
    private final GroupService groupService;
    private final DeckService deckService;
    private final CardService cardService;
    private final AgentProgress progress;

    private UUID createdDeckId;
    private UUID createdSetId;
    private int cardsAdded;
    private int toolCalls;

    public AgentTools(
            UUID userId,
            UUID preferredSetId,
            int maxCards,
            GroupService groupService,
            DeckService deckService,
            CardService cardService) {
        this(userId, preferredSetId, maxCards, groupService, deckService, cardService, AgentProgress.noop());
    }

    public AgentTools(
            UUID userId,
            UUID preferredSetId,
            int maxCards,
            GroupService groupService,
            DeckService deckService,
            CardService cardService,
            AgentProgress progress) {
        this.userId = userId;
        this.preferredSetId = preferredSetId;
        this.maxCards = maxCards;
        this.groupService = groupService;
        this.deckService = deckService;
        this.cardService = cardService;
        this.progress = progress == null ? AgentProgress.noop() : progress;
        this.createdSetId = preferredSetId;
    }

    public UUID createdDeckId() {
        return createdDeckId;
    }

    public UUID createdSetId() {
        return createdSetId;
    }

    public int cardsAdded() {
        return cardsAdded;
    }

    @Tool(description = "List the user's existing sets (folders of decks). Use this before creating a set.")
    public String listSets() {
        String tooMany = beginTool("listSets", null);
        if (tooMany != null) {
            return tooMany;
        }
        var groups = groupService.list(userId);
        StringJoiner json = new StringJoiner(",", "[", "]");
        for (GroupResponse group : groups) {
            json.add("{\"id\":\"" + group.id() + "\",\"name\":\"" + escape(group.name()) + "\",\"deckCount\":"
                    + group.deckCount() + "}");
        }
        return json.toString();
    }

    @Tool(description = """
            Create a set (a named folder of decks) or return an existing set with the same name.
            Only call this if the user asked for a class, course, or collection, or if no set was provided.
            """)
    public String createSet(
            @ToolParam(description = "Short set name, for example Spanish 101") String name,
            @ToolParam(description = "Hex color like #4C6FFF", required = false) String color) {
        String tooMany = beginTool("createSet", clip(name, 80));
        if (tooMany != null) {
            return tooMany;
        }
        try {
            String trimmed = clip(name, 80);
            if (trimmed.isEmpty()) {
                return error("Set name is required");
            }
            var existing = groupService.list(userId).stream()
                    .filter(group -> group.name().equalsIgnoreCase(trimmed))
                    .findFirst();
            if (existing.isPresent()) {
                createdSetId = existing.get().id();
                return "{\"setId\":\"" + existing.get().id() + "\",\"name\":\"" + escape(existing.get().name())
                        + "\",\"existing\":true}";
            }
            GroupResponse created = groupService.create(userId, new GroupRequest(trimmed, colorOrDefault(color)));
            createdSetId = created.id();
            return "{\"setId\":\"" + created.id() + "\",\"name\":\"" + escape(created.name()) + "\",\"existing\":false}";
        } catch (ApiException ex) {
            return error(ex.getMessage());
        }
    }

    @Tool(description = """
            Create exactly one flashcard deck for this request.
            Put it in preferredSetId or a set you just created when that makes sense.
            """)
    public String createDeck(
            @ToolParam(description = "Deck name") String name,
            @ToolParam(description = "One-sentence description of what the deck covers", required = false)
                    String description,
            @ToolParam(description = "BCP-47 language on the front of cards, for example es-ES") String frontLanguage,
            @ToolParam(description = "BCP-47 language on the back of cards, for example en-US") String backLanguage,
            @ToolParam(description = "Optional set id to put the deck in", required = false) String setId) {
        String tooMany = beginTool("createDeck", clip(name, 80));
        if (tooMany != null) {
            return tooMany;
        }
        if (createdDeckId != null) {
            return error("A deck was already created for this request. Add cards to deckId " + createdDeckId);
        }
        try {
            String trimmed = clip(name, 200);
            if (trimmed.isEmpty()) {
                return error("Deck name is required");
            }
            UUID groupId = parseUuid(setId);
            if (groupId == null) {
                groupId = createdSetId;
            }
            if (groupId == null) {
                groupId = preferredSetId;
            }
            String fallback = CardLanguages.DEFAULT;
            DeckResponse deck = deckService.create(
                    userId,
                    new DeckRequest(
                            trimmed,
                            clip(description, 2000),
                            groupId,
                            CardLanguages.normalizeOrFallback(frontLanguage, fallback),
                            CardLanguages.normalizeOrFallback(backLanguage, fallback)));
            createdDeckId = deck.id();
            if (deck.group() != null) {
                createdSetId = deck.group().id();
            }
            return "{\"deckId\":\"" + deck.id() + "\",\"name\":\"" + escape(deck.name()) + "\"}";
        } catch (ApiException ex) {
            return error(ex.getMessage());
        }
    }

    @Tool(description = "Add flashcards to the deck created in this request. Call once with as many cards as needed, up to the limit.")
    public String addCards(
            @ToolParam(description = "The deckId returned by create_deck") String deckId,
            @ToolParam(description = "Cards to add. Each needs a front prompt and a back answer.")
                    List<AgentCardInput> cards) {
        int requested = cards == null ? 0 : cards.size();
        String tooMany = beginTool("addCards", requested + " cards");
        if (tooMany != null) {
            return tooMany;
        }
        UUID id = parseUuid(deckId);
        if (id == null) {
            return error("deckId is required");
        }
        if (createdDeckId != null && !createdDeckId.equals(id)) {
            return error("Only add cards to the deck created in this request: " + createdDeckId);
        }
        if (cards == null || cards.isEmpty()) {
            return error("Provide at least one card");
        }
        int room = Math.max(0, maxCards - cardsAdded);
        if (room == 0) {
            return error("Card limit of " + maxCards + " already reached");
        }
        List<CardDraft> drafts = cards.stream()
                .limit(room)
                .map(card -> new CardDraft(card.front(), card.back(), card.hint()))
                .toList();
        try {
            int added = cardService.createMany(userId, id, drafts);
            cardsAdded += added;
            createdDeckId = id;
            return "{\"added\":" + added + ",\"cardCount\":" + cardsAdded + ",\"deckId\":\"" + id + "\"}";
        } catch (ApiException ex) {
            return error(ex.getMessage());
        }
    }

    private String beginTool(String code, String detail) {
        if (++toolCalls > MAX_TOOL_CALLS) {
            progress.step("tooManyTools", String.valueOf(toolCalls));
            return error("Stop. Too many tool calls for this request.");
        }
        progress.step(code, detail);
        return null;
    }

    private static UUID parseUuid(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return UUID.fromString(value.trim());
        } catch (IllegalArgumentException ex) {
            return null;
        }
    }

    private static String colorOrDefault(String color) {
        if (color != null && color.trim().matches("^#[0-9A-Fa-f]{6}$")) {
            return color.trim().toUpperCase();
        }
        return DEFAULT_SET_COLOR;
    }

    private static String clip(String value, int max) {
        if (value == null) {
            return "";
        }
        String trimmed = value.trim();
        return trimmed.length() <= max ? trimmed : trimmed.substring(0, max);
    }

    private static String error(String message) {
        return "{\"error\":\"" + escape(message) + "\"}";
    }

    private static String escape(String value) {
        if (value == null) {
            return "";
        }
        return value.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", " ");
    }

    public record AgentCardInput(String front, String back, String hint) {
    }
}
