package com.dk_power.power_plant_java.sevice.logging.ai;

import org.springframework.stereotype.Component;

import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;
import java.util.regex.Pattern;

/** Versioned, opaque external cursor containing time plus the Phase 1 event id. */
@Component
public class AiDiagnosticsCursorCodec {

    private static final byte VERSION = 1;
    private static final int HEADER_BYTES = 1 + Long.BYTES + Integer.BYTES + Short.BYTES;
    private static final int MAX_SOURCE_EVENT_ID_BYTES = 128;
    private static final Pattern SOURCE_EVENT_ID = Pattern.compile("^[A-Za-z0-9_-]{8,128}$");

    public String encode(Instant timestamp, String sourceEventId) {
        if (timestamp == null || sourceEventId == null || !SOURCE_EVENT_ID.matcher(sourceEventId).matches()) {
            throw new IllegalArgumentException("timestamp and source event id are required");
        }
        byte[] eventIdBytes = sourceEventId.getBytes(StandardCharsets.UTF_8);
        if (eventIdBytes.length > MAX_SOURCE_EVENT_ID_BYTES) {
            throw new IllegalArgumentException("source event id is too long");
        }
        ByteBuffer payload = ByteBuffer.allocate(HEADER_BYTES + eventIdBytes.length);
        payload.put(VERSION);
        payload.putLong(timestamp.getEpochSecond());
        payload.putInt(timestamp.getNano());
        payload.putShort((short) eventIdBytes.length);
        payload.put(eventIdBytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(payload.array());
    }

    public DecodedCursor decode(String cursor) {
        if (cursor == null || cursor.isBlank()) {
            return null;
        }
        try {
            byte[] payload = Base64.getUrlDecoder().decode(cursor);
            if (payload.length < HEADER_BYTES || payload.length > HEADER_BYTES + MAX_SOURCE_EVENT_ID_BYTES) {
                throw new IllegalArgumentException("cursor has an invalid size");
            }
            ByteBuffer buffer = ByteBuffer.wrap(payload);
            if (buffer.get() != VERSION) {
                throw new IllegalArgumentException("cursor version is unsupported");
            }
            Instant timestamp = Instant.ofEpochSecond(buffer.getLong(), buffer.getInt());
            int eventIdLength = Short.toUnsignedInt(buffer.getShort());
            if (eventIdLength == 0 || eventIdLength != buffer.remaining()) {
                throw new IllegalArgumentException("cursor payload is invalid");
            }
            byte[] eventIdBytes = new byte[eventIdLength];
            buffer.get(eventIdBytes);
            String sourceEventId = new String(eventIdBytes, StandardCharsets.UTF_8);
            if (!SOURCE_EVENT_ID.matcher(sourceEventId).matches()) {
                throw new IllegalArgumentException("cursor event id is invalid");
            }
            return new DecodedCursor(timestamp, sourceEventId);
        } catch (RuntimeException e) {
            throw new IllegalArgumentException("cursor is invalid", e);
        }
    }

    public record DecodedCursor(Instant timestamp, String sourceEventId) {
    }
}
