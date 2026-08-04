package com.dk_power.power_plant_java.entities.sync;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

/**
 * One durable ADD or REMOVE event for a single element of an aggregate-membership relationship (an
 * owning-side {@code @ManyToMany}, or a protected unidirectional {@code @OneToMany}). Together these
 * form an <b>LWW-Element-Set (OR-Set)</b>: an element is PRESENT iff its latest ADD strictly outranks
 * its latest REMOVE by the sync total order (timestamp, originMachineId, changeId).
 *
 * <p>Plain {@code @Entity} (NOT {@code BaseIdEntity}) — this is LOCAL per-node bookkeeping derived
 * from the already-synced {@code FieldChange}s, and must NEVER itself sync. Every node records the
 * same events from the same changes and computes the same present-set via a per-element max, so
 * membership converges regardless of delivery order — which the whole-set snapshot + single
 * last-writer-wins apply could not do (it silently dropped concurrent edits).
 *
 * <p>Bounded: only the latest ADD and latest REMOVE per {@code (owner, field, element)} are kept
 * (older ops are dominated), so this survives {@code FieldChange} log compaction.
 *
 * <p>See {@code project/features/sync-and-backup/m2m-membership-convergence.md}.
 */
@Entity
@Table(name = "membership_event",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_membership_event",
                columnNames = {"owner_type", "owner_id", "field_name", "element_id", "op"}),
        indexes = @Index(name = "ix_membership_owner_field",
                columnList = "owner_type,owner_id,field_name"))
@Getter
@Setter
@NoArgsConstructor
public class MembershipEvent {

    public enum Op { ADD, REMOVE, RESET }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "owner_type", nullable = false)
    private String ownerType;

    @Column(name = "owner_id", nullable = false)
    private Long ownerId;

    @Column(name = "field_name", nullable = false)
    private String fieldName;

    @Column(name = "element_id", nullable = false)
    private Long elementId;

    @Enumerated(EnumType.STRING)
    @Column(name = "op", nullable = false, length = 8)
    private Op op;

    // Sync total-order key of the change that produced this op (same for every element in the change).
    @Column(name = "ts", nullable = false)
    private Instant ts;

    @Column(name = "origin")
    private String origin;

    @Column(name = "change_id")
    private UUID changeId;

    public MembershipEvent(String ownerType, Long ownerId, String fieldName, Long elementId,
                           Op op, Instant ts, String origin, UUID changeId) {
        this.ownerType = ownerType;
        this.ownerId = ownerId;
        this.fieldName = fieldName;
        this.elementId = elementId;
        this.op = op;
        this.ts = ts;
        this.origin = origin;
        this.changeId = changeId;
    }
}
