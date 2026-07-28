package com.dk_power.power_plant_java.sevice.users;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.concurrent.atomic.AtomicReference;

/**
 * Per-desktop in-memory cache of the last known SharePoint schedule verification time. Kept
 * up-to-date by two paths:
 *
 * <ol>
 *   <li>This desktop just pushed to {@code /ng/schedule/sync} → local update via
 *       {@link #recordLocalCheck(Instant, String)}.</li>
 *   <li>Peer desktop pushed → hub emits SSE {@code schedule.check.heartbeat} →
 *       {@code ServerSseClient} calls {@link #recordFromSse(Instant, String)}.</li>
 * </ol>
 *
 * <p>Used by {@code NgScheduleController.freshness} to answer Electron auto-refresh gates.
 * In-memory only — after restart, first tick makes a real SP pull and refills the cache. Safe on
 * hub too (the same bean also runs there for its own /freshness endpoint; hub's authoritative
 * value is {@link HubScheduleHeartbeatService}).
 */
@Slf4j
@Service
public class LocalScheduleHeartbeatCache {

    private final AtomicReference<Instant> latestCheckAt = new AtomicReference<>();
    private final AtomicReference<String> latestSource = new AtomicReference<>();

    /** This node just pushed to {@code /ng/schedule/sync}. Advance if newer. */
    public void recordLocalCheck(Instant checkedAt, String source) {
        update(checkedAt, source, "local");
    }

    /** A peer's heartbeat arrived via hub SSE. Advance if newer. */
    public void recordFromSse(Instant checkedAt, String source) {
        update(checkedAt, source, "sse");
    }

    private void update(Instant checkedAt, String source, String origin) {
        if (checkedAt == null) return;
        Instant prev;
        do {
            prev = latestCheckAt.get();
            if (prev != null && !checkedAt.isAfter(prev)) return;
        } while (!latestCheckAt.compareAndSet(prev, checkedAt));
        latestSource.set(source == null ? "unknown" : source);
        log.debug("[LocalHeartbeat/{}] updated checkedAt={} source={}", origin, checkedAt, source);
    }

    public Instant getLatestCheckAt() { return latestCheckAt.get(); }
    public String getLatestSource() { return latestSource.get(); }
}
