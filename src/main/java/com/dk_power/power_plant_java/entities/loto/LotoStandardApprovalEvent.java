package com.dk_power.power_plant_java.entities.loto;

import com.dk_power.power_plant_java.entities.base_entities.BaseIdEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Immutable audit log of significant transitions on a {@link LotoStandard}'s
 * development lifecycle. One row per event. Never updated after insert — when
 * an APPROVED standard is modified, an INVALIDATED row is appended (the prior
 * APPROVED row is preserved).
 */
@Entity
@Table(name = "loto_standard_approval_event", indexes = {
        @Index(name = "idx_lsae_standard", columnList = "standard_id"),
        @Index(name = "idx_lsae_event_at", columnList = "event_at")
})
@Getter
@Setter
@NoArgsConstructor
public class LotoStandardApprovalEvent extends BaseIdEntity {

    public enum Type {
        SUBMITTED_FOR_VERIFICATION,
        VERIFIED,
        WALKDOWN_COMPLETE,
        READY_FOR_TESTING,
        APPROVED,
        /** @deprecated replaced by EDIT_PENDING_REVIEW / EDIT_ACCEPTED_AS_MINOR / EDIT_REQUIRES_REAPPROVAL. */
        @Deprecated INVALIDATED,
        REAPPROVED,
        /** First edit to an APPROVED standard, opening the pending-review window. */
        EDIT_PENDING_REVIEW,
        /** Reviewer closed the review keeping the standard APPROVED. */
        EDIT_ACCEPTED_AS_MINOR,
        /** Reviewer closed the review and flipped to NEW_PENDING_REAPPROVAL. */
        EDIT_REQUIRES_REAPPROVAL
    }

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "standard_id", nullable = false)
    private LotoStandard standard;

    /** Snapshot of the standard's version at the time of this event. */
    @Column(name = "standard_version")
    private Integer standardVersion;

    @Enumerated(EnumType.STRING)
    @Column(name = "event_type", nullable = false, length = 32)
    private Type eventType;

    @Column(name = "performed_by", length = 128)
    private String performedBy;

    @Column(name = "event_at", nullable = false)
    private LocalDateTime eventAt;

    @Column(name = "from_status", length = 64)
    private String fromStatus;

    @Column(name = "to_status", length = 64)
    private String toStatus;

    @Column(name = "notes", length = 2000)
    private String notes;
}
