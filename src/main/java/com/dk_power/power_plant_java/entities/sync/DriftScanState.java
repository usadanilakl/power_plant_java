package com.dk_power.power_plant_java.entities.sync;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

/**
 * Per-entity-type record of the last drift scan (local, per-machine — like {@link DriftRecord}, it never
 * syncs). Lets the UI show a confident GREEN "verified in sync" on a clean row (we know the type was
 * actually scanned, not just "no record yet"), drives the background scheduler's bookkeeping, and is the
 * data source for the consolidated Drift Center's per-type overview.
 */
@Entity
@Table(name = "drift_scan_state",
        uniqueConstraints = @UniqueConstraint(name = "uq_drift_scan_state_type", columnNames = {"entityType"}))
@Getter
@Setter
@NoArgsConstructor
public class DriftScanState {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String entityType;

    private Instant lastScannedAt;

    /** Whether this type is SharePoint-backed (so the UI can label the SP peer meaningfully). */
    private boolean spBacked;

    /** Active (FLAGGED + ACKNOWLEDGED) drift rows for this type at the last scan — the overview count. */
    private int flaggedCount;

    /** Non-null if the last scan hit a problem (e.g. the hub content-hash endpoint was unreachable). */
    @Column(columnDefinition = "TEXT")
    private String lastError;
}
