package com.dk_power.power_plant_java.entities.schedule;

import com.dk_power.power_plant_java.entities.base_entities.BaseAuditEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.Where;

/**
 * Schedule v2 — a named crew (A, B, C, D, …) that follows a {@link CrewRotation}, phased into the
 * cycle by {@link #offsetDays} so the four 24/7 crews cover all shifts. People are placed onto the
 * crew via {@link CrewAssignment} (ROTATING type); the crew's rotation decides their shift each day.
 *
 * <p>Crew display name reuses the inherited {@code name}.
 */
@Entity
@Table(name = "crew")
@Getter
@Setter
@NoArgsConstructor
@Where(clause = "deleted IS NOT TRUE")
public class Crew extends BaseAuditEntity {

    /** The rotation this crew follows. Nullable (a crew may be defined before a rotation is chosen). */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rotation_id")
    private CrewRotation rotation;

    /** Days added to the absolute cycle index — phases this crew into the rotation (crew-level offset). */
    @Column(name = "offset_days")
    private Integer offsetDays;

    /** Hex tint for the crew (chips, grid). */
    @Column(name = "color")
    private String color;

    @Column(name = "is_active")
    private Boolean isActive;
}
