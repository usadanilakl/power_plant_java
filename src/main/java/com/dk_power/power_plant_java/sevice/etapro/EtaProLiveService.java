package com.dk_power.power_plant_java.sevice.etapro;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.atomic.AtomicReference;

/**
 * In-memory singleton holding the currently active live subscription.
 *
 * <p>Only one live subscription exists at a time. Starting a new one replaces the old.
 * The {@link EtaProScrapeWorker} reads this state on each tick to decide whether to
 * run a live cycle.
 *
 * <p>State is NOT persisted — a restart clears the subscription and the user
 * must explicitly restart live mode from the UI.
 */
@Service
@Slf4j
@ConditionalOnProperty(name = "etapro.enabled", havingValue = "true", matchIfMissing = false)
public class EtaProLiveService {

    /** Immutable snapshot of the current live subscription, or null if stopped. */
    public record LiveSubscription(
            List<String> pointIds,
            LocalDateTime startedAt,
            LocalDateTime lastCycleAt,
            int lastCycleCount
    ) {}

    private final AtomicReference<LiveSubscription> current = new AtomicReference<>(null);

    public void start(List<String> pointIds) {
        if (pointIds == null || pointIds.isEmpty()) {
            throw new IllegalArgumentException("pointIds must not be empty");
        }
        LiveSubscription sub = new LiveSubscription(
                new ArrayList<>(pointIds),
                LocalDateTime.now(),
                null,
                0
        );
        current.set(sub);
        log.info("[EtaPro] Live subscription started: {} points", pointIds.size());
    }

    public void stop() {
        if (current.get() != null) {
            log.info("[EtaPro] Live subscription stopped");
        }
        current.set(null);
    }

    public boolean isActive() {
        return current.get() != null;
    }

    public LiveSubscription snapshot() {
        return current.get();
    }

    public List<String> getSubscribedPoints() {
        LiveSubscription sub = current.get();
        return sub == null ? Collections.emptyList() : new ArrayList<>(sub.pointIds());
    }

    /**
     * Called by the worker after a live cycle completes to update timestamps.
     * Atomically replaces the snapshot if the subscription is still active.
     */
    public void recordCycleComplete(int cycleCount) {
        LiveSubscription sub = current.get();
        if (sub == null) return; // stopped during the cycle
        current.compareAndSet(sub, new LiveSubscription(
                sub.pointIds(),
                sub.startedAt(),
                LocalDateTime.now(),
                cycleCount
        ));
    }
}
