package com.flashcards.agent;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

class AgentModelErrorsTest {

    @Test
    void treatsHighDemand503AsBusy() {
        RuntimeException error = new RuntimeException(
                "503: [{\"error\":{\"code\":503,\"message\":\"This model is currently experiencing high demand. Spikes in demand are usually temporary. Please try again later.\",\"status\":\"UNAVAILABLE\"}}]");
        assertTrue(AgentModelErrors.isBusy(error));
        assertEquals(AgentModelErrors.BUSY, AgentModelErrors.userMessage(error));
    }

    @Test
    void treatsNestedCauseAsBusy() {
        RuntimeException error = new RuntimeException("chat failed", new RuntimeException("503: overloaded"));
        assertTrue(AgentModelErrors.isBusy(error));
    }

    @Test
    void treatsFreeTierQuotaAsQuotaNotBusy() {
        RuntimeException error = new RuntimeException(
                "429: [{\"error\":{\"code\":429,\"message\":\"You exceeded your current quota, please check your plan and billing details.\",\"status\":\"RESOURCE_EXHAUSTED\"}}]");
        assertTrue(AgentModelErrors.isQuota(error));
        assertFalse(AgentModelErrors.isBusy(error));
        assertEquals(AgentModelErrors.QUOTA, AgentModelErrors.userMessage(error));
    }

    @Test
    void genericFailuresAreNotBusy() {
        RuntimeException error = new RuntimeException("connection reset");
        assertFalse(AgentModelErrors.isBusy(error));
        assertEquals(AgentModelErrors.FAILED, AgentModelErrors.userMessage(error));
    }
}
