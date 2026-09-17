package com.flashcards.agent;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.UUID;

import org.junit.jupiter.api.Test;

class AgentJobStoreTest {

    private static final UUID USER = UUID.fromString("00000000-0000-0000-0000-000000000031");

    @Test
    void oneCreditAllowsOnlyOneInFlightJob() {
        AgentJobStore store = new AgentJobStore();
        UUID first = UUID.fromString("00000000-0000-0000-0000-0000000000a1");
        UUID second = UUID.fromString("00000000-0000-0000-0000-0000000000a2");

        assertTrue(store.tryBegin(USER, first, 1));
        assertFalse(store.tryBegin(USER, second, 1));
        assertEquals(1, store.activeCount(USER));

        store.end(USER, first);
        assertEquals(0, store.activeCount(USER));
        assertTrue(store.tryBegin(USER, second, 1));
    }

    @Test
    void twoCreditsAllowTwoInFlightJobs() {
        AgentJobStore store = new AgentJobStore();
        UUID first = UUID.fromString("00000000-0000-0000-0000-0000000000b1");
        UUID second = UUID.fromString("00000000-0000-0000-0000-0000000000b2");
        UUID third = UUID.fromString("00000000-0000-0000-0000-0000000000b3");

        assertTrue(store.tryBegin(USER, first, 2));
        assertTrue(store.tryBegin(USER, second, 2));
        assertFalse(store.tryBegin(USER, third, 2));
        assertEquals(2, store.activeCount(USER));
    }
}
