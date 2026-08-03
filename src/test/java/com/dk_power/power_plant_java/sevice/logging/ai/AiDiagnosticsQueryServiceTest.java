package com.dk_power.power_plant_java.sevice.logging.ai;

import com.dk_power.power_plant_java.config.diagnostics.AiDiagnosticsProperties;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.Set;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AiDiagnosticsQueryServiceTest {

    @Test
    void clampsWindowAndLimitBeforeDelegating() {
        AiDiagnosticsProperties properties = new AiDiagnosticsProperties();
        properties.setMaxHistoricalMinutes(60);
        properties.setMaxEventsPerResponse(25);
        AtomicReference<AiDiagnosticsQuery> captured = new AtomicReference<>();
        AiDiagnosticsQueryService service = new AiDiagnosticsQueryService(properties, query -> {
            captured.set(query);
            return new AiDiagnosticsEventPage(java.util.List.of(), null, false, false);
        });

        Instant to = Instant.now().minusSeconds(5);
        service.query("agent", to.minusSeconds(24 * 60 * 60), to, 999, null, "asc",
            Set.of("error"), null, null, null, null, null, null, null);

        assertEquals(25, captured.get().limit());
        assertEquals(to.minusSeconds(60 * 60), captured.get().from());
        assertEquals(Set.of("ERROR"), captured.get().levels());
        assertEquals(AiDiagnosticsSort.ASC, captured.get().sort());
    }

    @Test
    void rejectsOversizedSearchAndInvalidRange() {
        AiDiagnosticsProperties properties = new AiDiagnosticsProperties();
        properties.setMaxSearchTextLength(4);
        AiDiagnosticsQueryService service = new AiDiagnosticsQueryService(properties,
            query -> new AiDiagnosticsEventPage(java.util.List.of(), null, false, false));

        assertThrows(IllegalArgumentException.class, () -> service.query(
            "agent", null, null, 10, null, "desc", Set.of(), "12345",
            null, null, null, null, null, null));

        Instant now = Instant.now();
        assertThrows(IllegalArgumentException.class, () -> service.query(
            "agent", now, now.minusSeconds(1), 10, null, "desc", Set.of(), null,
            null, null, null, null, null, null));

        assertThrows(IllegalArgumentException.class, () -> service.query(
            "agent", null, null, 10, null, "sideways", Set.of(), null,
            null, null, null, null, null, null));

        assertThrows(IllegalArgumentException.class, () -> service.query(
            "agent", null, Instant.MIN, 10, null, "desc", Set.of(), null,
            null, null, null, null, null, null));
    }
}
