package com.flashcards.agent;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.Test;

class AgentEditToolsTest {

    @Test
    void recordsARealChangeAndKeepsTheHintWhenOmitted() {
        UUID id = UUID.randomUUID();
        AgentEditTools tools = tools(new AgentEditTools.SourceCard(id, 0, "1. Hola", "Hello", "greeting"));

        String result = tools.proposeChanges(List.of(
                new AgentEditTools.ProposedChange(id.toString(), "Hola", "Hello", null)));

        assertTrue(result.contains("\"accepted\":1"));
        assertEquals(1, tools.changes().size());
        AgentCardChange change = tools.changes().get(0);
        assertEquals("Hola", change.afterFront());
        assertEquals("Hello", change.afterBack());
        assertEquals("greeting", change.afterHint());
        assertEquals(0, tools.unchangedCount());
    }

    @Test
    void dropsACardThatDidNotChange() {
        UUID id = UUID.randomUUID();
        AgentEditTools tools = tools(new AgentEditTools.SourceCard(id, 1, "Hola", "Hello", null));

        tools.proposeChanges(List.of(
                new AgentEditTools.ProposedChange(id.toString(), "Hola", "Hello", "")));

        assertTrue(tools.changes().isEmpty());
        assertEquals(1, tools.unchangedCount());
    }

    @Test
    void clearsAHintOnlyWhenTheProposalSendsOne() {
        UUID id = UUID.randomUUID();
        AgentEditTools tools = tools(new AgentEditTools.SourceCard(id, 0, "Hola", "Hello", "greeting"));

        tools.proposeChanges(List.of(
                new AgentEditTools.ProposedChange(id.toString(), "Hola", "Hello", "  ")));

        assertEquals(1, tools.changes().size());
        assertNull(tools.changes().get(0).afterHint());
        assertEquals("greeting", tools.changes().get(0).beforeHint());
    }

    @Test
    void ignoresUnknownIdsAndBlankSides() {
        UUID id = UUID.randomUUID();
        AgentEditTools tools = tools(new AgentEditTools.SourceCard(id, 0, "Hola", "Hello", null));

        String result = tools.proposeChanges(List.of(
                new AgentEditTools.ProposedChange(UUID.randomUUID().toString(), "A", "B", null),
                new AgentEditTools.ProposedChange(id.toString(), " ", "Hello", null)));

        assertTrue(result.contains("\"error\""));
        assertTrue(tools.changes().isEmpty());
    }

    private static AgentEditTools tools(AgentEditTools.SourceCard card) {
        return new AgentEditTools(List.of(card), AgentProgress.noop());
    }
}
