package com.dk_power.power_plant_java.sevice.etapro;

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
import java.util.List;
import java.util.Optional;

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

        EtaProScrapeJob saved = jobRepo.save(job);
        log.info("[EtaPro] Submitted history job {}: {} points × {} batches", saved.getId(), pointIds.size(), saved.getBatchesTotal());
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
        return jobRepo.findFirstByModeAndStatusOrderByDateCreatedAsc(Mode.HISTORY, Status.PENDING);
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
     * On startup: any job left in RUNNING state (Java crashed mid-job) gets marked FAILED.
     * Per user decision 1b.
     */
    @Transactional
    public void reapOrphanedJobs() {
        List<EtaProScrapeJob> orphans = jobRepo.findByStatus(Status.RUNNING);
        for (EtaProScrapeJob job : orphans) {
            job.setStatus(Status.FAILED);
            job.setErrorMessage("Job orphaned by application restart — please retry");
            job.setCompletedAt(LocalDateTime.now());
            jobRepo.save(job);
            log.warn("[EtaPro] Reaped orphaned job {} → FAILED", job.getId());
        }
    }

    /** Immutable batch descriptor. */
    public record BatchPlan(List<String> pointIds, LocalDateTime start, LocalDateTime end) {}
}
