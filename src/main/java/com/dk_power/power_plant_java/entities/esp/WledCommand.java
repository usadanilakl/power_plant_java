package com.dk_power.power_plant_java.entities.esp;

import com.dk_power.power_plant_java.entities.base_entities.BaseIdEntity;
import com.dk_power.power_plant_java.enums.WledCommandStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * A per-ESP "refresh me" marker. Not a specific box change and not a specific
 * WLED payload — the leader that pops this row is expected to read the current
 * LotoBox state for {@link #espDeviceId} out of the database, build the full
 * LED array from scratch, and POST it to WLED.
 * <p>
 * Rationale: box changes coalesce. If 30 boxes flip within one queue tick,
 * we don't want 30 payloads queued — we want ONE refresh that reflects all 30
 * changes when it fires. Dedup happens on enqueue via
 * {@code WledCommandRepo.existsPendingForEsp}.
 * <p>
 * Retry policy carries over from the previous per-payload design (exponential
 * backoff via {@link #retryCount} / {@link #nextRetryAt}, EXPIRED at
 * {@link #maxRetries}). Errors don't lose state — the next refresh reads DB
 * again, so an EXPIRED command just needs to be superseded by a fresh enqueue
 * (e.g. from the next box change or a manual re-sync).
 */
@Entity
@Getter
@Setter
@NoArgsConstructor
public class WledCommand extends BaseIdEntity {

    /** Target ESP — leader looks up its IP + LED strips fresh at processing time. */
    private Long espDeviceId;

    @Enumerated(EnumType.STRING)
    private WledCommandStatus commandStatus = WledCommandStatus.PENDING;

    private int retryCount = 0;
    private int maxRetries = 5;
    private LocalDateTime nextRetryAt;

    @Column(columnDefinition = "TEXT")
    private String lastError;

    private LocalDateTime createdAt = LocalDateTime.now();
}
