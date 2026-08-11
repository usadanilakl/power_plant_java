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

import java.time.LocalDate;

/**
 * Schedule v2 — a temporary per-crew shift override for a date window (the "outage schedule").
 * During an outage a crew often holds a single shift instead of following its rotation — e.g.
 * crews A+B stay on nights and C+D work days for three weeks, with no switching. For each day in
 * [{@link #startDate}, {@link #endDate}] the materialiser pins {@link #crew} to {@link #shift}
 * ({@code D}/{@code N}/{@code OFF}) and skips the normal {@link CrewRotation} cycle; the rotation
 * resumes automatically once the window ends (the cycle math is absolute-epoch-anchored, so a crew
 * picks up wherever its cycle would have been).
 *
 * <p>Grouped for the UI by {@link #label} (the outage name) so a single outage can pin several
 * crews at once.
 */
@Entity
@Table(name = "crew_shift_override")
@Getter
@Setter
@NoArgsConstructor
@Where(clause = "deleted IS NOT TRUE")
public class CrewShiftOverride extends BaseAuditEntity {

    /** Allowed values for {@link #shift}. OFF removes the crew from the schedule for the window. */
    public static final class Shift {
        public static final String DAY = "D";
        public static final String NIGHT = "N";
        public static final String OFF = "OFF";
        private Shift() {}
    }

    /** The outage / campaign name — groups the per-crew rows shown together in the UI. */
    @Column(name = "label")
    private String label;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "crew_id")
    private Crew crew;

    /** One of {@link Shift} — the shift this crew holds across the window. */
    @Column(name = "shift")
    private String shift;

    @Column(name = "is_active")
    private Boolean isActive = Boolean.TRUE;
}
