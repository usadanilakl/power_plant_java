package com.dk_power.power_plant_java.entities.permits;

import com.dk_power.power_plant_java.entities.base_entities.BaseAuditEntity;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.NotFound;
import org.hibernate.annotations.NotFoundAction;
import org.hibernate.annotations.Where;

/**
 * A place that needs air monitoring while work is live there.
 *
 * <p>The list is <b>derived</b> from the open Confined Space and Hot Work permits — those are the
 * two permit types that imply an atmosphere to watch — and then edited by hand on top. Deriving it
 * is the point: a monitored-area list that someone has to remember to add to is a list that will be
 * missing the space nobody thought about.
 *
 * <h2>Why manual removals are remembered</h2>
 *
 * {@link #manuallyRemoved} exists because regeneration runs repeatedly. Without it, an area an
 * authorised user deliberately took off the list would reappear the next time the sweep ran, and
 * they would have to remove it again after every refresh until the permit closed. A removal is a
 * decision; the derivation must not overrule it.
 *
 * <p>The converse is deliberately NOT symmetrical: a manually added area is never auto-removed,
 * because nothing about a closing permit proves the space stopped needing monitoring.
 *
 * <h2>Why last-tested is not stored here</h2>
 *
 * It is computed from {@link AirTest}. Denormalising it onto this row would mean every reading
 * wrote to two synced entities instead of one, doubling the field-change traffic and creating a
 * value that can disagree with the tests it summarises.
 */
@Entity
@Table(name = "monitored_area", indexes = {
        // The regeneration sweep looks areas up by their source permit on every pass.
        @Index(name = "idx_monitored_area_source", columnList = "source_type, source_permit_id"),
})
@Getter
@Setter
@NoArgsConstructor
@Where(clause = "deleted IS NOT TRUE")
public class MonitoredArea extends BaseAuditEntity {

    /** CONFINED_SPACE | HOT_WORK | MANUAL — where this entry came from. */
    private String sourceType;

    /**
     * The permit that put it on the list, when it was derived. Plain Long rather than an
     * association: the source permit is soft-deletable and may be closed and gone long before the
     * area is, and an entry outliving its source is normal rather than a broken reference.
     */
    private Long sourcePermitId;

    /** The vessel or space, when it is narrower than the work area. */
    private String spaceName;

    @ManyToOne
    @NotFound(action = NotFoundAction.IGNORE)
    @JoinColumn(name = "work_area_id")
    private WorkArea workArea;

    /**
     * Off means "no longer needs monitoring" — the source permit closed and nobody has said
     * otherwise. Kept as a flag rather than a delete so the tests taken against it stay reachable.
     */
    private Boolean requiresMonitoring = Boolean.TRUE;

    /** Somebody took this off the list on purpose. Regeneration must not put it back. */
    private Boolean manuallyRemoved = Boolean.FALSE;

    /** How often it should be re-tested, in hours. Null means the site default applies. */
    private Integer testIntervalHours;

    private String notes;
}
