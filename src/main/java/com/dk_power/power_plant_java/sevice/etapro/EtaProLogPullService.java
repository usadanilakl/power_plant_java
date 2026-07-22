package com.dk_power.power_plant_java.sevice.etapro;

import com.dk_power.power_plant_java.entities.etapro.EtaProLogEntry;
import com.dk_power.power_plant_java.repository.etapro.EtaProLogEntryRepo;
import com.dk_power.power_plant_java.sevice.etapro.EtaProScraperEngine.BatchResult;
import com.dk_power.power_plant_java.sevice.etapro.EtaProScraperEngine.Template;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicLong;
import java.util.concurrent.atomic.AtomicReference;

/**
 * Pulls EtaPRO Event Log entries via the EPLog template.
 *
 * <p><b>Async, worker-owned.</b> A scrape blocks on the external PowerShell/Excel process for up to
 * ~2 minutes, so the pull is NOT run on the caller's (Tomcat) thread. Instead a request is queued
 * ({@link #requestPull}) and the single {@link EtaProScrapeWorker} thread — which already owns all
 * Excel access — runs it via {@link #runPendingIfAny()}. Callers poll {@link #status()}.
 *
 * <p>Incremental pulls use the newest stored Create Time as a watermark, re-pulling a small overlap
 * window for boundary safety; the engine deduplicates on the composite key.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@ConditionalOnProperty(name = "etapro.enabled", havingValue = "true", matchIfMissing = false)
public class EtaProLogPullService {

    private final EtaProScraperEngine engine;
    private final EtaProLogEntryRepo logRepo;
    /** Present only when etapro.api.enabled — the REST API is the PRIMARY EPLog source when set. */
    private final Optional<EtaProApiService> apiService;

    /** First-run window when the table is empty. */
    @Value("${etapro.eplog.backfill.days:30}")
    private int backfillDays;

    /** Re-pull overlap behind the watermark so boundary entries aren't missed. */
    @Value("${etapro.eplog.window.overlap.minutes:60}")
    private int overlapMinutes;

    /** When true, an API failure is NOT retried via the scraper (API-only). */
    @Value("${etapro.api.strict:false}")
    private boolean strict;

    public enum PullState { IDLE, QUEUED, RUNNING, DONE, FAILED }

    /** Immutable status snapshot for the UI to poll. {@code requestId} distinguishes successive pulls. */
    public record PullStatus(
            long requestId,
            PullState state,
            LocalDateTime rangeStart,   // null = incremental
            LocalDateTime rangeEnd,
            LocalDateTime requestedAt,
            LocalDateTime completedAt,
            Integer imported,
            Integer scraped,
            String message
    ) {}

    /** A queued pull request. null start/end = incremental. */
    private record Pending(long requestId, LocalDateTime start, LocalDateTime end) {}

    private final AtomicReference<PullStatus> status = new AtomicReference<>(
            new PullStatus(0, PullState.IDLE, null, null, null, null, null, null, "idle"));
    private final AtomicReference<Pending> pending = new AtomicReference<>(null);
    private final AtomicLong reqSeq = new AtomicLong(0);

    /** Current status snapshot (lock-free read). */
    public PullStatus status() {
        return status.get();
    }

    /**
     * Queue a pull to be run by the worker thread. Coalesces: if a pull is already QUEUED or RUNNING,
     * the new request is ignored and the in-flight status is returned. A partial range (one of
     * start/end null) is treated as incremental; an inverted range (start &gt; end) is rejected.
     */
    public synchronized PullStatus requestPull(LocalDateTime start, LocalDateTime end) {
        if (start != null && end != null && start.isAfter(end)) {
            throw new IllegalArgumentException("rangeStart must be on or before rangeEnd");
        }
        if (start == null || end == null) { start = null; end = null; }  // partial range -> incremental

        PullState s = status.get().state();
        if (s == PullState.QUEUED || s == PullState.RUNNING) {
            return status.get();  // already in flight — don't stack
        }
        long id = reqSeq.incrementAndGet();
        pending.set(new Pending(id, start, end));
        PullStatus queued = new PullStatus(id, PullState.QUEUED, start, end,
                LocalDateTime.now(), null, null, null, "queued");
        status.set(queued);
        return queued;
    }

    /**
     * Worker-only: run the queued pull if one exists. Returns true if it did work. The scrape itself
     * runs OUTSIDE the lock so {@link #requestPull} is never blocked for the duration of a scrape.
     * Always leaves a terminal (DONE/FAILED) status — never stuck on RUNNING.
     */
    public boolean runPendingIfAny() {
        Pending p;
        LocalDateTime requestedAt;
        synchronized (this) {
            p = pending.getAndSet(null);
            if (p == null) return false;
            requestedAt = status.get().requestedAt();
            status.set(new PullStatus(p.requestId(), PullState.RUNNING, p.start(), p.end(),
                    requestedAt, null, null, null, "running"));
        }

        PullStatus terminal;
        try {
            BatchResult r = (p.start() != null && p.end() != null)
                    ? pull(p.start(), p.end())
                    : pullIncremental();
            terminal = new PullStatus(p.requestId(), r.success ? PullState.DONE : PullState.FAILED,
                    p.start(), p.end(), requestedAt, LocalDateTime.now(),
                    r.importedCount, r.scrapedCount, r.message);
        } catch (Exception e) {
            log.error("[EtaPro] EPLog pull failed", e);
            terminal = new PullStatus(p.requestId(), PullState.FAILED, p.start(), p.end(),
                    requestedAt, LocalDateTime.now(), 0, 0, "Pull failed: " + e.getMessage());
        }
        synchronized (this) { status.set(terminal); }
        return true;
    }

    // ── Actual work (runs on the worker thread only) ──────────

    private BatchResult pullIncremental() {
        LocalDateTime end = LocalDateTime.now();
        LocalDateTime watermark = logRepo.findMaxCreateTime();
        LocalDateTime start = (watermark == null)
                ? end.minusDays(backfillDays)
                : watermark.minusMinutes(overlapMinutes);
        log.info("[EtaPro] EPLog incremental pull {} -> {} (watermark={})", start, end, watermark);
        return fetchEpLogBatch(start, end);
    }

    private BatchResult pull(LocalDateTime start, LocalDateTime end) {
        log.info("[EtaPro] EPLog explicit pull {} -> {}", start, end);
        return fetchEpLogBatch(start, end);
    }

    /**
     * API-first EPLog fetch with scraper fallback — mirrors the history data-source policy.
     * The REST API returns proper entries (with a real EntryIdKey), no UI Automation needed.
     */
    private BatchResult fetchEpLogBatch(LocalDateTime start, LocalDateTime end) {
        if (apiService.isPresent()) {
            String sessionId = UUID.randomUUID().toString();
            try {
                List<EtaProLogEntry> entries = apiService.get().fetchEpLog(start, end, sessionId);
                int imported = engine.saveLogEntries(entries);
                String msg = imported + "/" + entries.size() + " log entries via API";
                log.debug("[EtaPro] EPLog batch via API: {}", msg);
                return new BatchResult(true, msg, entries.size(), imported, sessionId);
            } catch (Exception e) {
                log.warn("[EtaPro] API EPLog fetch failed: {}", e.getMessage());
                if (strict) {
                    return BatchResult.failure("API EPLog fetch failed (strict, no fallback): " + e.getMessage(), sessionId);
                }
                log.info("[EtaPro] Falling back to Excel scraper (Refresh EPLog) for this pull");
            }
        }
        return engine.executeBatch(Template.EPLOG, List.of(), start, end);
    }
}
