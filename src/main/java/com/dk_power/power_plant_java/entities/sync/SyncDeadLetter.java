package com.dk_power.power_plant_java.entities.sync;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

/**
 * A field-change that could not be applied and is being held for inspection/replay instead of
 * being silently dropped. Deliberately a PLAIN entity (NOT a {@code BaseIdEntity}) so it carries
 * no sync listener and never itself emits a {@link FieldChange} — it is a purely node-local
 * diagnostic record.
 *
 * <p>Written today for the {@code reason=NO_SERVICE} case (an entity type with no registered
 * {@code SyncableService}); designed to also hold poison messages bounded by an attempt counter.
 * Rows are upserted by {@code (changeId, machineId)} so a repeatedly re-pulled change bumps
 * {@code attempts}/{@code lastSeenAt} rather than inserting duplicates.
 */
@Entity
@Table(name = "sync_dead_letter", indexes = {
        @Index(name = "idx_sdl_change_machine", columnList = "changeId,machineId", unique = true),
        @Index(name = "idx_sdl_entity_type", columnList = "entityType"),
        @Index(name = "idx_sdl_resolved", columnList = "resolved")
})
@Getter
@Setter
@NoArgsConstructor
public class SyncDeadLetter {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** The originating {@link FieldChange#getId()} (null for aggregated/synthetic records). */
    private UUID changeId;

    private String entityType;
    private Long entityId;
    private String fieldName;

    @Column(columnDefinition = "TEXT")
    private String oldValue;

    @Column(columnDefinition = "TEXT")
    private String newValue;

    private String changeType;
    private String originMachineId;

    /** Which node holds this dead-letter (this machine's id). */
    private String machineId;

    /** Why it was dead-lettered, e.g. {@code NO_SERVICE}. */
    private String reason;

    private Instant firstSeenAt;
    private Instant lastSeenAt;

    private int attempts;

    /** Set true once the underlying cause is fixed and the change has been replayed. */
    private boolean resolved;
}
