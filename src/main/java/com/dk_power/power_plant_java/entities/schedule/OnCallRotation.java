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
 * Schedule v2 — the on-call manager (OCM) rotation. A single manager is on-call at a time, rotating
 * through an ordered list, each for {@link #daysPerTurn} days (typically 7 = weekly), cycling forever
 * from {@link #anchorDate}. The materialiser folds the current manager into each day's
 * {@code ShiftDay.onCallManager} field.
 *
 * <p>Members are stored as a JSON array of {@code User} ids in rotation order ({@link #memberUserIdsJson}).
 * Rotation name reuses the inherited {@code name}.
 */
@Entity
@Table(name = "on_call_rotation")
@Getter
@Setter
@NoArgsConstructor
@Where(clause = "deleted IS NOT TRUE")
public class OnCallRotation extends BaseAuditEntity {

    /** Days each manager is on-call before handing off (e.g. 7 for weekly). */
    @Column(name = "days_per_turn")
    private Integer daysPerTurn;

    /** The date the first member's first turn begins; the rotation is anchored here. */
    @Column(name = "anchor_date")
    private LocalDate anchorDate;

    /** JSON array of {@code User} ids in rotation order. */
    @Column(name = "member_user_ids", columnDefinition = "TEXT")
    private String memberUserIdsJson;

    @Column(name = "is_active")
    private Boolean isActive;
}
