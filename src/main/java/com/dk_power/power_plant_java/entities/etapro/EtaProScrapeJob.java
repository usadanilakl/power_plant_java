package com.dk_power.power_plant_java.entities.etapro;

import com.dk_power.power_plant_java.entities.base_entities.BaseAuditEntity;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.Enumerated;
import jakarta.persistence.EnumType;
import jakarta.persistence.FetchType;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.Where;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Tracks a user-submitted EtaPro scrape job.
 *
 * <p>Two modes:
 * <ul>
 *   <li><b>HISTORY</b>: fetches a finite time range, broken into day-sized batches
 *       and 20-point groups. Terminal when all batches complete.</li>
 *   <li><b>LIVE</b>: persistent subscription that keeps running until explicitly
 *       stopped. Only one LIVE job can be RUNNING at a time.</li>
 * </ul>
 */
@Entity
@Getter
@Setter
@NoArgsConstructor
@Where(clause = "deleted IS NOT TRUE")
@Table(indexes = {
        @Index(name = "idx_etapro_job_status", columnList = "status"),
        @Index(name = "idx_etapro_job_mode", columnList = "mode")
})
public class EtaProScrapeJob extends BaseAuditEntity {

    public enum Mode { HISTORY, LIVE }

    public enum Status {
        PENDING,    // submitted, waiting for worker
        RUNNING,    // worker is processing batches
        COMPLETE,   // all batches finished successfully (HISTORY only)
        FAILED,     // a batch errored; see errorMessage
        CANCELLED   // user cancelled mid-run
    }

    @Enumerated(EnumType.STRING)
    private Mode mode;

    @Enumerated(EnumType.STRING)
    private Status status = Status.PENDING;

    /**
     * Device number of the node that created this job (from {@code SyncConfig.getDeviceNumber()}).
     * The job entity syncs to every node, but ONLY the owning node's worker executes it — this stops
     * a single user-triggered scrape from fanning out and opening Excel on every online desktop.
     * Nullable for legacy rows created before ownership existed (those are simply never claimed).
     */
    private Integer ownerDeviceNumber;

    /** Null for LIVE jobs. */
    private LocalDateTime rangeStart;

    /** Null for LIVE jobs. */
    private LocalDateTime rangeEnd;

    @ElementCollection(fetch = FetchType.EAGER)
    @Column(name = "point_id", length = 128)
    private List<String> pointIds = new ArrayList<>();

    /** Total number of batches this job will run (0 for LIVE). */
    private int batchesTotal;

    /** Batches finished so far. */
    private int batchesCompleted;

    /** Total readings imported so far (deduped count). */
    private long readingsImported;

    private LocalDateTime startedAt;

    private LocalDateTime completedAt;

    @Column(length = 1000)
    private String errorMessage;
}
