package com.dk_power.power_plant_java.sevice.users;

import com.dk_power.power_plant_java.controller.sync.SyncUpdateController;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.concurrent.atomic.AtomicReference;

/**
 * In-memory, hub-only "who last verified the SharePoint schedule?" tracker. Complements the
 * data-change timestamp ({@code max(shift_days.date_modified)}) by capturing check activity
 * even when the schedule hasn't changed (which is the common case). Without it, every desktop's
 * freshness gate would fire every interval because no-change refreshes never bump
 * {@code date_modified}.
 *
 * <p>Not persisted: after a hub restart, the value is null → first desktop that ticks does a real
 * SP pull → heartbeat re-populates → subsequent desktops skip. One wasted refresh per hub restart
 * is acceptable and self-heals.
 *
 * <p>Hub-only via {@code @ConditionalOnProperty(sync.role=hub)}.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@ConditionalOnProperty(name = "sync.role", havingValue = "hub")
public class HubScheduleHeartbeatService {

    private final SyncUpdateController syncUpdateController;

    /** Latest received heartbeat, or {@code null} if none since hub boot. */
    private final AtomicReference<Instant> latestCheckAt = new AtomicReference<>();
    /** Machine name / id that reported the latest heartbeat (best-effort diagnostic). */
    private final AtomicReference<String> latestSource = new AtomicReference<>();

    /**
     * Record a heartbeat from a desktop that just verified SharePoint (whether or not data
     * changed). Broadcasts the new value via SSE so peer desktops update their local caches
     * immediately — otherwise they'd need to poll hub before every tick.
     */
    public void recordHeartbeat(Instant checkedAt, String source) {
        Instant now = Instant.now();
        // Guard against silly future/past clocks — clamp to now if wildly off.
        Instant safe = (checkedAt == null || checkedAt.isAfter(now.plusSeconds(300)) || checkedAt.isBefore(now.minusSeconds(3600)))
                ? now : checkedAt;

        Instant prev;
        do {
            prev = latestCheckAt.get();
            if (prev != null && !safe.isAfter(prev)) {
                // Out-of-order arrival — keep the newer value we already have.
                return;
            }
        } while (!latestCheckAt.compareAndSet(prev, safe));

        latestSource.set(source == null ? "unknown" : source);
        log.debug("[HubHeartbeat] recorded checkedAt={} source={}", safe, source);

        // Broadcast to peer desktops (they'll bump their own local caches).
        try {
            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("type", "schedule.check.heartbeat");
            payload.put("checkedAt", safe.toString());
            payload.put("source", latestSource.get());
            payload.put("timestamp", System.currentTimeMillis());
            String json = new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(payload);
            // broadcastEvent is private — go through the entity_updated shape isn't right either.
            // Piggyback on the existing schedule.refresh emission channel using SSE event name.
            syncUpdateController.broadcastScheduleCheckHeartbeat(json);
        } catch (Exception e) {
            log.debug("[HubHeartbeat] SSE broadcast failed (non-fatal): {}", e.getMessage());
        }
    }

    /** Most recent heartbeat, or {@code null} if none. */
    public Instant getLatestCheckAt() { return latestCheckAt.get(); }

    /** Source of the most recent heartbeat, or {@code null}. */
    public String getLatestSource() { return latestSource.get(); }
}
