package com.dk_power.power_plant_java.entities.schedule;

import com.dk_power.power_plant_java.entities.base_entities.BaseAuditEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.Where;

/**
 * Schedule v2 — a configurable operator position (Lead, CRO, AO, Mechanic, I&C, …). Replaces the
 * old hardcoded role enum so plants can define their own positions. Referenced by name from
 * {@link CrewAssignment#getPosition()}; a label, not a rotation driver (the whole crew shares one
 * shift each day per its {@link CrewRotation}).
 *
 * <p>Position display name reuses the inherited {@code name} field.
 */
@Entity
@Table(name = "schedule_position")
@Getter
@Setter
@NoArgsConstructor
@Where(clause = "deleted IS NOT TRUE")
public class SchedulePosition extends BaseAuditEntity {

    /** Short label for compact display, e.g. "CRO". */
    @Column(name = "abbreviation")
    private String abbreviation;

    /** Hex tint for chips/labels. */
    @Column(name = "color")
    private String color;

    /** Manual ordering in pickers/tables (lower = earlier). */
    @Column(name = "sort_order")
    private Integer sortOrder;

    @Column(name = "is_active")
    private Boolean isActive;
}
