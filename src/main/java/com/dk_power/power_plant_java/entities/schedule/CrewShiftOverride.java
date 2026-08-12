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
 * Schedule v2 — a per-crew ROTATION FREEZE for a date window (used for outages / smooth transitions).
 * During [{@link #startDate}, {@link #endDate}] the crew keeps its <b>exact normal on/off pattern</b>
 * from its {@link CrewRotation} (same working days, same off days — still 2-on/2-off/5-on/5-off) but
 * <b>stops switching day↔night</b>: every working day is held to {@link #shift} ({@code D} or
 * {@code N}). {@code OFF} drops the crew from the schedule for the whole window. The rotation resumes
 * automatically once the window ends (the cycle math is absolute-epoch-anchored, so the crew picks up
 * wherever its cycle would have been).
 *
 * <p>One row per crew — each carries its OWN {@code startDate}/{@code endDate} so crews can stop and
 * resume rotating at different times (align to each crew's block boundary for a smooth hand-over).
 * The optional {@link #label} just groups related freezes in the UI.
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
