package com.dk_power.power_plant_java.sevice.etapro;

import com.dk_power.power_plant_java.config.SyncConfig;
import com.dk_power.power_plant_java.entities.etapro.EtaProScrapeJob;
import com.dk_power.power_plant_java.entities.etapro.EtaProScrapeJob.Mode;
import com.dk_power.power_plant_java.entities.etapro.EtaProScrapeJob.Status;
import com.dk_power.power_plant_java.repository.etapro.EtaProScrapeJobRepo;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Manages the history scrape job lifecycle: submission, batching plan, progress
 * tracking, and cancellation. Does NOT run the actual batches — that's the
 * worker's job. This service only owns the DB state.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@ConditionalOnProperty(name = "etapro.enabled", havingValue = "true", matchIfMissing = false)
public class EtaProHistoryJobService {

    private final EtaProScrapeJobRepo jobRepo;
    private final SyncConfig syncConfig;

    /**
     * IDs of jobs submitted by an explicit user action IN THIS PROCESS. The worker runs ONLY these —
     * never a PENDING job that merely synced in from the hub (e.g. re-introduced after a DB restore or
     * resync). Combined with device-ownership + the startup reap, this keeps collection strictly
     * explicit-and-in-session. In-memory, so it is empty after a restart (nothing auto-resumes).
     */
    private final Set<Long> submittedThisSession = ConcurrentHashMap.newKeySet();

    /**
     * Submit a new history job. Computes batch count, persists as PENDING.
     * The worker picks it up on its next tick.
     *
     * @param pointIds  up to any number of point IDs — will be split into 20-point groups
     * @param rangeStart inclusive start (UTC-naive local)
     * @param rangeEnd   inclusive end; split into 1-day batches
     * @return persisted job with assigned ID and batchesTotal
     */
    @Transactional
    public EtaProScrapeJob submitJob(List<String> pointIds, LocalDateTime rangeStart, LocalDateTime rangeEnd) {
        if (pointIds == null || pointIds.isEmpty()) {
            throw new IllegalArgumentException("pointIds must not be empty");
        }
        if (rangeStart == null || rangeEnd == null) {
            throw new IllegalArgumentException("rangeStart and rangeEnd are required for history jobs");
        }
        if (!rangeEnd.isAfter(rangeStart)) {
            throw new IllegalArgumentException("rangeEnd must be after rangeStart");
        }

        EtaProScrapeJob job = new EtaProScrapeJob();
        job.setMode(Mode.HISTORY);
        job.setStatus(Status.PENDING);
        job.setRangeStart(rangeStart);
        job.setRangeEnd(rangeEnd);
        job.setPointIds(new ArrayList<>(pointIds));
        job.setBatchesTotal(computeTotalBatches(pointIds.size(), rangeStart, rangeEnd));
        job.setBatchesCompleted(0);
        job.setReadingsImported(0);
        // Pin execution to THIS node. The job syncs everywhere, but only this device's worker claims it.
        job.setOwnerDeviceNumber(syncConfig.getDeviceNumber());

        EtaProScrapeJob saved = jobRepo.save(job);
        submittedThisSession.add(saved.getId());  // explicit, in-session — the worker will run this one
        log.info("[EtaPro] Submitted history job {} (owner device {}): {} points × {} batches",
                saved.getId(), saved.getOwnerDeviceNumber(), pointIds.size(), saved.getBatchesTotal());
        return saved;
    }

    /** Formula: ceil(points/20) × number_of_day_slices */
    public static int computeTotalBatches(int pointCount, LocalDateTime rangeStart, LocalDateTime rangeEnd) {
        int pointGroups = (int) Math.ceil(pointCount / (double) EtaProScraperEngine.MAX_POINTS_PER_HISTORY_BATCH);
        int daySlices = computeDaySlices(rangeStart, rangeEnd);
        return pointGroups * daySlices;
    }

    /** Number of 1-day windows needed to cover [start, end]. */
    public static int computeDaySlices(LocalDateTime start, LocalDateTime end) {
        long hours = java.time.Duration.between(start, end).toHours();
        return (int) Math.ceil(Math.max(hours, 1) / 24.0);
    }

    /**
     * Build the ordered list of (pointGroup × dayWindow) batches for a job.
     * Batches run in this order: day-1 group-1, day-1 group-2, ..., day-2 group-1, ...
     */
    public List<BatchPlan> planBatches(EtaProScrapeJob job) {
        List<BatchPlan> plan = new ArrayList<>();
        List<List<String>> pointGroups = chunkPoints(job.getPointIds(), EtaProScraperEngine.MAX_POINTS_PER_HISTORY_BATCH);

        LocalDateTime sliceStart = job.getRangeStart();
        while (sliceStart.isBefore(job.getRangeEnd())) {
            LocalDateTime sliceEnd = sliceStart.plusDays(1);
            if (sliceEnd.isAfter(job.getRangeEnd())) sliceEnd = job.getRangeEnd();
            for (List<String> group : pointGroups) {
                plan.add(new BatchPlan(group, sliceStart, sliceEnd));
            }
            sliceStart = sliceEnd;
        }
        return plan;
    }

    /**
     * Split a flat list of point IDs into chunks of at most {@code chunkSize}.
     * Caller picks the chunk size based on mode:
     * {@link EtaProScraperEngine#MAX_POINTS_PER_HISTORY_BATCH} for history,
     * {@link EtaProScraperEngine#MAX_POINTS_PER_LIVE_BATCH} for live.
     */
    public static List<List<String>> chunkPoints(List<String> points, int chunkSize) {
        List<List<String>> chunks = new ArrayList<>();
        for (int i = 0; i < points.size(); i += chunkSize) {
            int end = Math.min(i + chunkSize, points.size());
            chunks.add(new ArrayList<>(points.subList(i, end)));
        }
        return chunks;
    }

    // ── State transitions (called by worker) ─────────────────

    @Transactional
    public void markRunning(Long jobId) {
        jobRepo.findById(jobId).ifPresent(job -> {
            job.setStatus(Status.RUNNING);
            if (job.getStartedAt() == null) job.setStartedAt(LocalDateTime.now());
            jobRepo.save(job);
        });
    }

    @Transactional
    public void recordBatchComplete(Long jobId, int importedCount) {
        jobRepo.findById(jobId).ifPresent(job -> {
            job.setBatchesCompleted(job.getBatchesCompleted() + 1);
            job.setReadingsImported(job.getReadingsImported() + importedCount);
            if (job.getBatchesCompleted() >= job.getBatchesTotal()) {
                job.setStatus(Status.COMPLETE);
                job.setCompletedAt(LocalDateTime.now());
            }
            jobRepo.save(job);
        });
    }

    @Transactional
    public void markFailed(Long jobId, String errorMessage) {
        jobRepo.findById(jobId).ifPresent(job -> {
            job.setStatus(Status.FAILED);
            job.setErrorMessage(errorMessage);
            job.setCompletedAt(LocalDateTime.now());
            jobRepo.save(job);
        });
    }

    @Transactional
    public void cancelJob(Long jobId) {
        jobRepo.findById(jobId).ifPresent(job -> {
            if (job.getStatus() == Status.COMPLETE || job.getStatus() == Status.FAILED
                    || job.getStatus() == Status.CANCELLED) return;
            job.setStatus(Status.CANCELLED);
            job.setCompletedAt(LocalDateTime.now());
            jobRepo.save(job);
        });
    }

    // ── Queries (worker + controller) ────────────────────────

    public Optional<EtaProScrapeJob> nextPendingHistoryJob() {
        // Run ONLY jobs this process explicitly submitted this session (and that this device owns).
        // A PENDING job synced in from the hub — even one owned by this device from a prior session or
        // re-introduced by a restore/resync — is NOT auto-run. Collection stays strictly explicit.
        if (submittedThisSession.isEmpty()) return Optional.empty();
        return jobRepo.findByStatusAndOwnerDeviceNumber(Status.PENDING, syncConfig.getDeviceNumber())
                .stream()
                .filter(j -> submittedThisSession.contains(j.getId()))
                .min(Comparator.comparing(EtaProScrapeJob::getId));
    }

    public Optional<EtaProScrapeJob> runningHistoryJob() {
        return jobRepo.findFirstByModeAndStatusOrderByDateCreatedAsc(Mode.HISTORY, Status.RUNNING);
    }

    public Optional<EtaProScrapeJob> getById(Long id) {
        return jobRepo.findById(id);
    }

    public Page<EtaProScrapeJob> listRecent(int page, int pageSize) {
        return jobRepo.findAllByOrderByDateCreatedDesc(PageRequest.of(page - 1, pageSize));
    }

    /**
     * Re-reads status to detect cancellation mid-run without loading the full entity.
     */
    public boolean isCancelled(Long jobId) {
        return jobRepo.findById(jobId).map(j -> j.getStatus() == Status.CANCELLED).orElse(true);
    }

    /**
     * On startup: clear THIS node's non-terminal jobs so a restart never autonomously resumes
     * collection (explicit-only policy). RUNNING jobs (crashed mid-run) → FAILED; PENDING jobs
     * (submitted but never started) → CANCELLED. Either way the user must explicitly re-submit.
     *
     * <p>Scoped to our own device — we must never touch another node's job (its status is synced in,
     * and clobbering it would sync back and disrupt the scrape on the machine that actually owns it).
     */
    @Transactional
    public void reapOrphanedJobs() {
        int myDevice = syncConfig.getDeviceNumber();

        List<EtaProScrapeJob> running = jobRepo.findByStatusAndOwnerDeviceNumber(Status.RUNNING, myDevice);
        for (EtaProScrapeJob job : running) {
            job.setStatus(Status.FAILED);
            job.setErrorMessage("Job orphaned by application restart — please retry");
            job.setCompletedAt(LocalDateTime.now());
            jobRepo.save(job);
            log.warn("[EtaPro] Reaped orphaned RUNNING job {} → FAILED", job.getId());
        }

        List<EtaProScrapeJob> pending = jobRepo.findByStatusAndOwnerDeviceNumber(Status.PENDING, myDevice);
        for (EtaProScrapeJob job : pending) {
            job.setStatus(Status.CANCELLED);
            job.setErrorMessage("Not auto-resumed after restart (collection is explicit-only) — please re-submit");
            job.setCompletedAt(LocalDateTime.now());
            jobRepo.save(job);
            log.warn("[EtaPro] Cancelled stale PENDING job {} on startup (explicit-only, no autonomous resume)", job.getId());
        }
    }

    /** Immutable batch descriptor. */
    public record BatchPlan(List<String> pointIds, LocalDateTime start, LocalDateTime end) {}
}
