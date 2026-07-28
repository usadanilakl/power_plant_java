package com.dk_power.power_plant_java.sevice.users;

import com.dk_power.power_plant_java.controller.sync.SyncUpdateController;
import com.dk_power.power_plant_java.repository.users.ShiftDayRepo;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;

/**
 * Hub-side watchdog: if no ShiftDay row on hub has been modified in the last
 * {@code hub.schedule-presence.stale-hours} hours, asks any online desktop to refresh the
 * schedule from SharePoint. Desktop-side auto-refresh timers are the primary mechanism; this is
 * the fallback for when the designated refresher is down or nobody has auto-refresh enabled.
 *
 * <p>Chain: hub SSE {@code schedule.refresh.requested} → desktop {@code ServerSseClient} → HTTP POST
 * to local Electron main process ({@code http://127.0.0.1:8083/trigger/personnel-refresh}) →
 * {@code PersonnelManager.tickAutoRefresh('trigger')} → SharePoint fetch + parse + backend push →
 * CRDT sync back to hub → this watchdog sees fresh {@code dateModified} and stops asking.
 *
 * <p>Hub-only via {@code @ConditionalOnProperty(sync.role=hub)}. If no desktop is online, the emit
 * is skipped and retried next tick. Idempotent: pinging the same desktop repeatedly just triggers
 * another refresh, which is a no-op if nothing changed.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@ConditionalOnProperty(name = "sync.role", havingValue = "hub")
public class SchedulePresenceCoordinator {

    private final ShiftDayRepo shiftDayRepo;
    private final SyncUpdateController syncUpdateController;

    /**
     * Poll for freshness every 15 min by default. Cheap query (single MAX aggregate). If stale
     * beyond {@code hub.schedule-presence.stale-hours} (default 8h), emit a refresh request to
     * exactly one desktop.
     */
    @Scheduled(fixedDelayString = "${hub.schedule-presence.check-interval-ms:900000}",
               initialDelayString = "${hub.schedule-presence.initial-delay-ms:120000}")
    public void checkFreshness() {
        long staleHours = Long.parseLong(System.getProperty("hub.schedule-presence.stale-hours", "8"));
        Optional<LocalDateTime> maxOpt = shiftDayRepo.findMaxDateModified();

        if (maxOpt.isEmpty()) {
            // No rows yet — the plant hasn't ingested any schedule. Try to pull one.
            requestRefresh("hub-cold-start");
            return;
        }
        LocalDateTime latest = maxOpt.get();
        LocalDateTime threshold = LocalDateTime.now().minusHours(staleHours);
        if (latest.isAfter(threshold)) {
            log.debug("[SchedulePresence] Fresh: latest={}, threshold={}", latest, threshold);
            return;
        }

        log.info("[SchedulePresence] Stale: latest={}, threshold={} (>{}h) — requesting desktop refresh",
                latest, threshold, staleHours);
        requestRefresh("hub-watchdog-stale");
    }

    private void requestRefresh(String reason) {
        if (!syncUpdateController.hasAnyClient()) {
            log.info("[SchedulePresence] No desktop clients online — cannot refresh schedule (will retry next tick)");
            return;
        }
        String picked = syncUpdateController.broadcastScheduleRefreshRequested(reason);
        if (picked == null) {
            log.warn("[SchedulePresence] All emit attempts failed — no reachable desktop");
        }
    }
}
