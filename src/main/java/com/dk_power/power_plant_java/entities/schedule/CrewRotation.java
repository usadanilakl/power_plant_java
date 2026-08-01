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
 * Schedule v2 — a crew-level rotation cycle (the "on/on/off/off/on/on/on…" pattern). One shift code
 * per day; the WHOLE crew assigned this rotation shares that shift. Reusable across crews (the four
 * 24/7 crews typically share one rotation, phased apart by each {@link Crew}'s offset).
 *
 * <p>Rotation display name reuses the inherited {@code name}. The cycle lives in {@link #rotationCells}:
 * a JSON array of {@code {dayIndex, shift}} where {@code shift} is one of {@link Shift}.
 */
@Entity
@Table(name = "crew_rotation")
@Getter
@Setter
@NoArgsConstructor
@Where(clause = "deleted IS NOT TRUE")
public class CrewRotation extends BaseAuditEntity {

    /** Allowed values for the {@code shift} key inside {@link #rotationCells}. */
    public static final class Shift {
        public static final String DAY = "D";
        public static final String NIGHT = "N";
        public static final String OFF = "O";
        private Shift() {}
    }

    /** Hex tint used by the UI. */
    @Column(name = "color")
    private String color;

    /** Rotation cycle length in days (e.g. 28). Cells repeat every {@code patternLengthDays}. */
    @Column(name = "pattern_length_days")
    private Integer patternLengthDays;

    /** The calendar date that maps to {@code dayIndex 0} of the cycle (crew offset 0) — i.e. when the
     *  rotation "started". Lets managers phase-align the whole schedule. Null = anchored to epoch day 0. */
    @Column(name = "anchor_date")
    private LocalDate anchorDate;

    /** JSON array of {@code {dayIndex, shift}} — the crew-level rotation cycle (one shift per day). */
    @Column(name = "rotation_cells", columnDefinition = "TEXT")
    private String rotationCells;

    @Column(name = "is_active")
    private Boolean isActive;
}
