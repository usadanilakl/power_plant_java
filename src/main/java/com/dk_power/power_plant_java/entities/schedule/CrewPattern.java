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
 * Schedule v2 — a rotation template for one crew. Authored by managers in the schedule builder.
 *
 * <p>The rotation itself lives in {@link #patternCells}: a JSON array of
 * {@code {dayIndex, role, shift}} objects (the "role × day grid"). {@code dayIndex} is 0-based
 * within the cycle (0 .. patternLengthDays-1); {@code role} is one of {@link Role}; {@code shift}
 * is one of {@link Shift}. Each (dayIndex, role) pair may appear once; the materialiser looks up a
 * person's shift by their assignment role and the current cycle day.
 *
 * <p>Crew display name reuses the inherited {@code name} field from BaseIdEntity.
 *
 * <p>Registered in {@code EntityTableRegistry} — syncs via field-level CRDT. Low churn (authored
 * rarely), so storing the grid as a single JSON field is cheap for the change tracker.
 */
@Entity
@Table(name = "crew_pattern")
@Getter
@Setter
@NoArgsConstructor
@Where(clause = "deleted IS NOT TRUE")
public class CrewPattern extends BaseAuditEntity {

    /** Allowed values for the {@code role} key inside {@link #patternCells}. */
    public static final class Role {
        public static final String LEAD = "LEAD";
        public static final String AO = "AO";
        public static final String RELIEF = "RELIEF";
        private Role() {}
    }

    /** Allowed values for the {@code shift} key inside {@link #patternCells}. */
    public static final class Shift {
        public static final String DAY = "D";
        public static final String NIGHT = "N";
        public static final String OFF = "O";
        public static final String RELIEF = "R";
        private Shift() {}
    }

    /** Hex tint used by the UI to colour this crew's cells (e.g. {@code #42A5F5}). */
    @Column(name = "color")
    private String color;

    /** Rotation cycle length in days (e.g. 28). Cells repeat every {@code patternLengthDays}. */
    @Column(name = "pattern_length_days")
    private Integer patternLengthDays;

    /**
     * JSON array of {@code {dayIndex, role, shift}} — the role × day rotation grid. Stored as a
     * single TEXT field so field-level sync tracks the whole grid as one change.
     */
    @Column(name = "pattern_cells", columnDefinition = "TEXT")
    private String patternCells;

    /** Whether this pattern is live. Inactive patterns are ignored by the materialiser. */
    @Column(name = "is_active")
    private Boolean isActive;
}
