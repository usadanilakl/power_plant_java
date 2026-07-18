package com.dk_power.power_plant_java.entities.sync;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

/**
 * A durable record that a specific row (or a specific field of a row) is drifted against the hub, per the
 * content-hash drift oracle. LOCAL/per-machine metadata: it is a plain {@code @Entity} (NOT a
 * {@link com.dk_power.power_plant_java.entities.base_entities.BaseIdEntity}), so it does NOT get the sync
 * listener and never itself syncs — a node's view of its own drift is meaningless on another node.
 *
 * <p>Persisting drift (vs. re-scanning live every time) is what lets a table/form show a stable
 * flagged/acknowledged/reconciled badge across sessions, keeps a resolution history, and survives the user
 * navigating away mid-review. The lifecycle mirrors {@code RoundIssue}: opened on first detection, kept
 * across scans while still drifting, and auto-closed when a later scan sees the row converge.
 *
 * <p>A row can drift against TWO peers independently ({@link #peer}: the hub, and — for SP-backed types —
 * SharePoint), so peer is part of the identity: the same row can carry a HUB record and a SHAREPOINT record.
 *
 * <p>{@link #fieldName} is {@code "_entity_"} for a ROW-level record (the whole row differs / is missing on
 * one side — the granularity the oracle reports); a concrete field name is used for a FIELD-level record
 * (populated when the user drills into a differing row). The unique key (entityType, entityId, fieldName,
 * peer) is what makes detection an idempotent upsert — hence the sentinel rather than a nullable column
 * (SQL treats NULLs as distinct, which would defeat the constraint).
 */
@Entity
@Table(name = "drift_record",
        uniqueConstraints = @UniqueConstraint(name = "uq_drift_record_key",
                columnNames = {"entityType", "entityId", "fieldName", "peer"}),
        indexes = {
                @Index(name = "ix_drift_record_type_status", columnList = "entityType, status"),
                @Index(name = "ix_drift_record_lookup", columnList = "entityType, entityId"),
                @Index(name = "ix_drift_record_status", columnList = "status")
        })
@Getter
@Setter
@NoArgsConstructor
public class DriftRecord {

    /** Row-level sentinel for {@link #fieldName} (the whole row drifts / is missing on one side). */
    public static final String ROW = "_entity_";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String entityType;
    private Long entityId;
    /** {@link #ROW} for a row-level record, else the drifted field name. Part of the upsert key. */
    private String fieldName = ROW;

    /** Which authority this row drifts against. Part of the upsert key. */
    @Enumerated(EnumType.STRING)
    private DriftPeer peer = DriftPeer.HUB;

    @Enumerated(EnumType.STRING)
    private DriftKind kind;

    @Enumerated(EnumType.STRING)
    private DriftStatus status = DriftStatus.FLAGGED;

    /** Snapshots captured for a FIELD-level record (null for a row-level record). */
    @Column(columnDefinition = "TEXT")
    private String localValue;
    @Column(columnDefinition = "TEXT")
    private String hubValue;

    private Instant firstDetectedAt;
    private Instant lastDetectedAt;

    private Instant resolvedAt;
    private String resolvedBy;
    /** How it closed: ACCEPTED_HUB / ACCEPTED_LOCAL / ACKNOWLEDGED / AUTO_CONVERGED. */
    private String resolution;
}
