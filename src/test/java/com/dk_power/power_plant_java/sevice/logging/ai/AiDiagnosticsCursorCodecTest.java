package com.dk_power.power_plant_java.sevice.logging.ai;

import org.junit.jupiter.api.Test;

import java.time.Instant;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;

class AiDiagnosticsCursorCodecTest {

    private final AiDiagnosticsCursorCodec codec = new AiDiagnosticsCursorCodec();

    @Test
    void roundTripsTimestampAndOpaqueSourceIdWithoutExposingEitherLiterally() {
        Instant timestamp = Instant.parse("2026-08-02T12:34:56.789Z");
        String sourceId = "QmFzZTY0VXJsU2FmZUV2ZW50SWQ";

        String encoded = codec.encode(timestamp, sourceId);
        var decoded = codec.decode(encoded);

        assertEquals(timestamp, decoded.timestamp());
        assertEquals(sourceId, decoded.sourceEventId());
        assertFalse(encoded.contains(sourceId));
    }

    @Test
    void rejectsMalformedOrUnsupportedCursor() {
        assertThrows(IllegalArgumentException.class, () -> codec.decode("not-base64!"));
        assertThrows(IllegalArgumentException.class, () -> codec.decode("AA"));
    }
}
