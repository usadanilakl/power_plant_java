package com.dk_power.power_plant_java.entities.loto;

import com.dk_power.power_plant_java.entities.base_entities.BaseIdEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.Where;

import java.time.LocalDateTime;

/**
 * One field-change captured while a {@link LotoStandard} is APPROVED but in
 * pending-review. Each edit on an APPROVED standard's content (point
 * procedure, predecessors, zero-energy method, etc.) writes one of these
 * rows. A CA or Manager then resolves each row as {@link Resolution#KEPT}
 * or {@link Resolution#DISMISSED} and closes the review.
 *
 * <p>See {@code project/features/loto-standard/loto-procedure.md} §3.3.
 *
 * <p>{@code lotoPointId} is nullable — fields edited directly on the
 * standard (name, description) have no associated point. {@code oldValue}
 * and {@code newValue} are stored as strings; complex fields (lists,
 * objects) are JSON-encoded by the caller.
 */
@Entity
@Table(name = "loto_standard_pending_change", indexes = {
        @Index(name = "idx_pending_change_standard", columnList = "standard_id"),
        @Index(name = "idx_pending_change_resolution", columnList = "resolution")
})
@Getter
@Setter
@NoArgsConstructor
@Where(clause = "deleted IS NOT TRUE")
public class LotoStandardPendingChange extends BaseIdEntity {

    public enum Resolution {
        /** Captured but not yet reviewed. */
        PENDING,
        /** Reviewer marked the change permanent. Field stays at {@code newValue}. */
        KEPT,
        /** Reviewer reverted the change. Field was restored to {@code oldValue}. */
        DISMISSED
    }

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "standard_id", nullable = false)
    private LotoStandard standard;

    /** Null when the edit was on the standard itself (not on one of its points). */
    @Column(name = "loto_point_id")
    private Long lotoPointId;

    /**
     * Set when this proposal originated from a LOTO permit derived from this
     * standard (permit-edit propagation flow). Null for direct edits made on
     * the standard form. Future PR will populate this from the permit-side
     * "send back to standard" affordance.
     */
    @Column(name = "source_permit_id")
    private Long sourcePermitId;

    @Column(name = "field_name", nullable = false, length = 128)
    private String fieldName;

    @Column(name = "old_value", columnDefinition = "TEXT")
    private String oldValue;

    @Column(name = "new_value", columnDefinition = "TEXT")
    private String newValue;

    @Column(name = "edited_by", nullable = false, length = 255)
    private String editedBy;

    @Column(name = "edited_at", nullable = false)
    private LocalDateTime editedAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "resolution", nullable = false, length = 16)
    private Resolution resolution = Resolution.PENDING;

    @Column(name = "resolved_by", length = 255)
    private String resolvedBy;

    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;
}
