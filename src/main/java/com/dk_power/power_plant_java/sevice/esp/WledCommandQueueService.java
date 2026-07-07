package com.dk_power.power_plant_java.sevice.esp;

import com.dk_power.power_plant_java.entities.esp.EspDevice;
import com.dk_power.power_plant_java.entities.esp.WledCommand;
import com.dk_power.power_plant_java.enums.WledCommandStatus;
import com.dk_power.power_plant_java.repository.esp.EspDeviceRepo;
import com.dk_power.power_plant_java.repository.esp.WledCommandRepo;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Async work queue for WLED refreshes.
 * <p>
 * <b>Enqueue side:</b> anything that changes a box color calls
 * {@link #enqueueEspRefresh(Long)} with the ESP id. Enqueue dedupes — if
 * there's already an unresolved (PENDING or FAILED) command for that ESP, we
 * skip. A burst of 30 box changes collapses to 1 refresh row.
 * <p>
 * <b>Processing side:</b> runs on {@link Scheduled} every 5s BUT gated on
 * {@link WledLeadershipService#isLeader()} — hub always runs it, desktops
 * only run it when the hub has been unreachable past the leadership grace
 * period. This gives us "hub-preferred with desktop failover" without any
 * cross-node coordination table (see {@link WledLeadershipService} javadoc
 * for the race analysis).
 * <p>
 * Each due command is handled by rebuilding the target ESP's full LED array
 * from current DB state and POSTing it via {@link EspLedService#syncFullLedArray}.
 * Success → SENT. Failure → retry with exponential backoff, EXPIRED at
 * {@link WledCommand#getMaxRetries}. An EXPIRED row just sits there — a
 * future box change will enqueue a fresh command and try again.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class WledCommandQueueService {

    private final WledCommandRepo wledCommandRepo;
    private final EspDeviceRepo espDeviceRepo;
    private final EspLedService espLedService;
    private final WledLeadershipService leadership;

    /**
     * Dedup-guarded enqueue. Called from {@link com.dk_power.power_plant_java.sevice.angular.loto.NgLotoBoxService}
     * on any box color change (LOTO-driven or manual). Idempotent — 30 rapid
     * changes to the same ESP produce one row.
     * <p>
     * The check-then-insert is racy under concurrent enqueues from the same
     * node; worst case is 2 refreshes queued instead of 1, which produces one
     * extra idempotent WLED POST. Not worth a lock table to prevent.
     */
    @Transactional
    public void enqueueEspRefresh(Long espDeviceId) {
        if (espDeviceId == null) return;

        boolean exists = wledCommandRepo.existsForEspInStatuses(
                espDeviceId,
                List.of(WledCommandStatus.PENDING, WledCommandStatus.FAILED));
        if (exists) return;

        WledCommand cmd = new WledCommand();
        cmd.setEspDeviceId(espDeviceId);
        cmd.setCommandStatus(WledCommandStatus.PENDING);
        cmd.setNextRetryAt(LocalDateTime.now());
        wledCommandRepo.save(cmd);
    }

    @Scheduled(fixedDelay = 5000)
    public void processQueue() {
        // Only the elected leader talks to ESP controllers. See WledLeadershipService.
        if (!leadership.isLeader()) return;

        List<WledCommand> due = readDueCommands();
        if (due.isEmpty()) return;

        List<WledCommand> toUpdate = new ArrayList<>();
        for (WledCommand cmd : due) {
            try {
                EspDevice esp = espDeviceRepo.findById(cmd.getEspDeviceId()).orElse(null);
                if (esp == null) {
                    // Device gone (deactivated / deleted). Mark EXPIRED so the row
                    // doesn't churn on every tick. If someone recreates the ESP
                    // and a fresh box change happens, a new command supersedes it.
                    cmd.setCommandStatus(WledCommandStatus.EXPIRED);
                    cmd.setLastError("ESP device id " + cmd.getEspDeviceId() + " not found");
                } else {
                    espLedService.syncFullLedArray(esp);
                    cmd.setCommandStatus(WledCommandStatus.SENT);
                    cmd.setLastError(null);
                }
            } catch (Exception e) {
                cmd.setRetryCount(cmd.getRetryCount() + 1);
                cmd.setLastError(e.getMessage());
                if (cmd.getRetryCount() >= cmd.getMaxRetries()) {
                    cmd.setCommandStatus(WledCommandStatus.EXPIRED);
                } else {
                    cmd.setCommandStatus(WledCommandStatus.FAILED);
                    long backoffSeconds = 5L * (1L << cmd.getRetryCount());
                    cmd.setNextRetryAt(LocalDateTime.now().plusSeconds(backoffSeconds));
                }
                log.warn("[WledQueue] ESP {} refresh failed (attempt {}/{}): {}",
                        cmd.getEspDeviceId(), cmd.getRetryCount(), cmd.getMaxRetries(), e.getMessage());
            }
            toUpdate.add(cmd);
        }

        saveCommandResults(toUpdate);
    }

    @Transactional(readOnly = true)
    public List<WledCommand> readDueCommands() {
        return wledCommandRepo.findDueCommands(
                List.of(WledCommandStatus.PENDING, WledCommandStatus.FAILED),
                LocalDateTime.now()
        );
    }

    @Transactional
    public void saveCommandResults(List<WledCommand> commands) {
        wledCommandRepo.saveAll(commands);
    }

    @Transactional(readOnly = true)
    public long getPendingCount() {
        return wledCommandRepo.countByCommandStatus(WledCommandStatus.PENDING)
                + wledCommandRepo.countByCommandStatus(WledCommandStatus.FAILED);
    }

    @Transactional(readOnly = true)
    public long getExpiredCount() {
        return wledCommandRepo.countByCommandStatus(WledCommandStatus.EXPIRED);
    }

    @Transactional
    public void clearSentCommands() {
        wledCommandRepo.deleteByCommandStatus(WledCommandStatus.SENT);
    }
}
