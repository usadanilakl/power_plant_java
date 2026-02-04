package com.dk_power.power_plant_java.sevice.sync;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

/**
 * Automatically triggers partial resync when the health checker detects
 * that the client is out of sync with the server. Uses an escalation
 * strategy: each failed attempt goes further back in time. After all
 * automatic attempts are exhausted, recommends a full resync to the user.
 *
 * Escalation schedule:
 *   Level 0 — suggestedSyncDate (last known good sync), fallback: 1 day ago
 *   Level 1 — 1 day ago
 *   Level 2 — 3 days ago
 *   Level 3 — 7 days ago
 *   Level 4 — 14 days ago
 *   Exhausted — stop, recommend full resync
 */
@Service
@Slf4j
public class AutoResyncService {

    private final FullResyncService fullResyncService;
    private final SyncHealthChecker syncHealthChecker;
    private final ObjectMapper objectMapper;

    @Value("${sync.auto-resync.enabled:true}")
    private boolean autoResyncEnabled;

    @Value("${project.root:}")
    private String projectRootPath;

    private static final int[] ESCALATION_DAYS_BACK = {0, 1, 3, 7, 14};
    private static final int MAX_ESCALATION_LEVEL = 4;
    private static final long COOLDOWN_SECONDS = 270; // ~4.5 min, slightly less than health check interval
    private static final String STATE_FILE = "auto-resync-state.json";

    private volatile AutoResyncState currentState = new AutoResyncState();

    public AutoResyncService(FullResyncService fullResyncService,
                             SyncHealthChecker syncHealthChecker,
                             ObjectMapper objectMapper) {
        this.fullResyncService = fullResyncService;
        this.syncHealthChecker = syncHealthChecker;
        this.objectMapper = objectMapper;
        this.currentState = loadState();
    }

    /**
     * Called from SyncHealthChecker after each periodic health check.
     * Evaluates whether to trigger an automatic partial resync.
     */
    public void evaluateAndTrigger(SyncHealthChecker.SyncHealthResult result) {
        if (!autoResyncEnabled) return;

        // If in sync, reset state
        if (result.getSyncStatus() == SyncHealthChecker.SyncStatus.IN_SYNC) {
            if (currentState.getEscalationLevel() > 0 || currentState.isAutoResyncExhausted()) {
                log.info("AUTO-RESYNC: System is back in sync. Resetting state.");
                resetState();
            }
            return;
        }

        // Don't trigger on UNKNOWN (server unreachable)
        if (result.getSyncStatus() == SyncHealthChecker.SyncStatus.UNKNOWN) return;

        // Don't trigger if resync is already running
        if (fullResyncService.isResyncInProgress() || currentState.isAutoResyncInProgress()) return;

        // Wait for consecutive threshold
        if (result.getConsecutiveOutOfSyncCount() < 2) return;

        // Don't trigger if exhausted
        if (currentState.isAutoResyncExhausted()) return;

        // Cooldown check
        if (currentState.getLastAttemptTime() != null) {
            long elapsed = Instant.now().getEpochSecond() - currentState.getLastAttemptTime().getEpochSecond();
            if (elapsed < COOLDOWN_SECONDS) return;
        }

        // Dedup drift detection: small entity diff with no file diff at level >= 2
        if (currentState.getEscalationLevel() >= 2
                && result.getEntityDifference() <= 5
                && result.getFileDifference() == 0) {
            log.info("AUTO-RESYNC: Small entity diff ({}) with no file diff. " +
                     "Likely deduplication drift. Stopping escalation.",
                     result.getEntityDifference());
            currentState.setAutoResyncExhausted(true);
            currentState.setLastAttemptMessage(
                "Small differences likely caused by deduplication. System is functionally in sync.");
            saveState(currentState);
            return;
        }

        // Determine the date for this escalation level
        int level = currentState.getEscalationLevel();
        String date = determineSyncDate(level, result.getSuggestedSyncDate());

        log.info("AUTO-RESYNC: Triggering level {} partial sync from date {}", level, date);
        executeAutoResync(date, level);
    }

    @Async
    public void executeAutoResync(String date, int level) {
        currentState.setAutoResyncInProgress(true);
        saveState(currentState);

        try {
            log.info("AUTO-RESYNC: Starting level {} partial sync from date {}", level, date);

            FullResyncService.PartialSyncResult result =
                    fullResyncService.performPartialSync(date, true);

            currentState.setLastAttemptTime(Instant.now());
            currentState.setLastAttemptDate(date);
            currentState.setLastAttemptSuccess(result.isSuccess());
            currentState.setLastAttemptMessage(result.getMessage());

            if (result.isSuccess()) {
                // Wait briefly, then re-check health
                Thread.sleep(5000);
                SyncHealthChecker.SyncHealthResult health = syncHealthChecker.checkNow();

                if (health.getSyncStatus() == SyncHealthChecker.SyncStatus.IN_SYNC) {
                    log.info("AUTO-RESYNC: Level {} succeeded! System is back in sync.", level);
                    currentState.setEscalationLevel(0);
                    currentState.setAutoResyncExhausted(false);
                } else {
                    log.warn("AUTO-RESYNC: Level {} completed but still out of sync. Escalating.", level);
                    escalate(level);
                }
            } else {
                log.warn("AUTO-RESYNC: Level {} failed: {}", level, result.getMessage());
                escalate(level);
            }
        } catch (Exception e) {
            log.error("AUTO-RESYNC: Level {} error: {}", level, e.getMessage(), e);
            escalate(level);
        } finally {
            currentState.setAutoResyncInProgress(false);
            saveState(currentState);
        }
    }

    private void escalate(int currentLevel) {
        int nextLevel = currentLevel + 1;
        if (nextLevel > MAX_ESCALATION_LEVEL) {
            currentState.setAutoResyncExhausted(true);
            currentState.setEscalationLevel(nextLevel);
            log.warn("AUTO-RESYNC: All {} automatic attempts exhausted. Full resync recommended.",
                    MAX_ESCALATION_LEVEL);
        } else {
            currentState.setEscalationLevel(nextLevel);
            log.info("AUTO-RESYNC: Escalated to level {}", nextLevel);
        }
    }

    private String determineSyncDate(int level, String suggestedDate) {
        if (level == 0 && suggestedDate != null && !suggestedDate.isEmpty()) {
            return suggestedDate;
        }
        int daysBack = (level >= 0 && level < ESCALATION_DAYS_BACK.length)
                ? ESCALATION_DAYS_BACK[level]
                : ESCALATION_DAYS_BACK[ESCALATION_DAYS_BACK.length - 1];
        if (daysBack == 0) daysBack = 1; // Level 0 fallback when no suggestedDate
        return LocalDate.now().minus(daysBack, ChronoUnit.DAYS).toString();
    }

    public AutoResyncState getCurrentState() {
        return currentState;
    }

    /**
     * Reset auto-resync state. Called by user from frontend to retry
     * or after a manual resync.
     */
    public void resetState() {
        currentState = new AutoResyncState();
        saveState(currentState);
    }

    // ==================== State Persistence ====================

    private AutoResyncState loadState() {
        Path statePath = getStatePath();
        if (Files.exists(statePath)) {
            try {
                return objectMapper.readValue(statePath.toFile(), AutoResyncState.class);
            } catch (Exception e) {
                log.warn("Could not load auto-resync state, starting fresh: {}", e.getMessage());
            }
        }
        return new AutoResyncState();
    }

    private void saveState(AutoResyncState state) {
        try {
            Path statePath = getStatePath();
            Files.createDirectories(statePath.getParent());
            objectMapper.writerWithDefaultPrettyPrinter()
                    .writeValue(statePath.toFile(), state);
        } catch (IOException e) {
            log.warn("Could not save auto-resync state: {}", e.getMessage());
        }
    }

    private Path getStatePath() {
        String root = (projectRootPath != null && !projectRootPath.isEmpty())
                ? projectRootPath : System.getProperty("user.dir");
        return Paths.get(root, STATE_FILE);
    }

    // ==================== DTO ====================

    @Data
    public static class AutoResyncState {
        private int escalationLevel = 0;
        private Instant lastAttemptTime;
        private boolean lastAttemptSuccess;
        private String lastAttemptDate;
        private String lastAttemptMessage;
        private boolean autoResyncExhausted;
        private boolean autoResyncInProgress;
    }
}
