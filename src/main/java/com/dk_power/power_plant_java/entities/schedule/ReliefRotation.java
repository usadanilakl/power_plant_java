package com.dk_power.power_plant_java.entities.schedule;

import com.dk_power.power_plant_java.entities.base_entities.BaseAuditEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.Where;

import java.time.LocalDate;

/**
 * Schedule v2 — the every-N-months Lead/AO "relief swap" rotation (one lane per position). At any
 * time exactly one person in the lane is the <b>relief</b> operator (fixed day shift on
 * {@link #reliefDaysOfWeek}); the rest occupy the crew slots and follow their crew's rotation. Each
 * period the relief person swaps places with the next person in {@link #lineOrderJson} — the incoming
 * relief leaves their crew slot, and the outgoing relief takes it — marching through the line forever
 * from {@link #anchorDate}. Computed from the anchor (no scheduled job); the materialiser resolves the
 * current relief + crew occupants per day and places them, overriding those people's static
 * assignments.
 *
 * <p><b>State is two JSON blobs:</b> {@link #lineOrderJson} = the succession order (User ids), and
 * {@link #initialSlotsJson} = the slot→User-id map at the anchor, where slot ∈ {@code REL,A,B,C,D}.
 */
@Entity
@Table(name = "relief_rotation")
@Getter
@Setter
@NoArgsConstructor
@Where(clause = "deleted IS NOT TRUE")
public class ReliefRotation extends BaseAuditEntity {

    /** Position label placed for this lane's members — e.g. "Lead" or "Auxiliary Operator". */
    @Column(name = "position")
    private String position;

    /** Length of one relief turn in months (typically 3 = quarterly). */
    @Column(name = "period_months")
    private Integer periodMonths;

    /** Start of the current known state ({@link #initialSlotsJson}); the rotation is anchored here. */
    @Column(name = "anchor_date")
    private LocalDate anchorDate;

    /** JSON array of {@code User} ids — the succession order the relief slot passes through. */
    @Column(name = "line_order", columnDefinition = "TEXT")
    private String lineOrderJson;

    /** JSON object {@code slot -> userId} at the anchor; slot is one of REL, A, B, C, D. */
    @Column(name = "initial_slots", columnDefinition = "TEXT")
    private String initialSlotsJson;

    /** CSV of day-of-week the relief person works day shift (MON,TUE,…); blank = every day. */
    @Column(name = "relief_days_of_week")
    private String reliefDaysOfWeek;

    @Column(name = "is_active")
    private Boolean isActive;
}
