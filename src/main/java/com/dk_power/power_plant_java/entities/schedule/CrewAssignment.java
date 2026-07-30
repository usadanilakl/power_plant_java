package com.dk_power.power_plant_java.entities.schedule;

import com.dk_power.power_plant_java.entities.base_entities.BaseAuditEntity;
import com.dk_power.power_plant_java.entities.users.User;
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
 * Schedule v2 — staffing: places one {@link User} in a {@link #position} for a date range. Three
 * flavours ({@link Type}):
 * <ul>
 *   <li><b>ROTATING</b> — belongs to a {@link Crew}; follows that crew's rotation (its shift each
 *       day comes from {@code crew.rotation} at the crew's offset).</li>
 *   <li><b>FIXED</b> — non-rotating (e.g. the day-only Lead / AO): works {@link #fixedShift} on the
 *       days in {@link #fixedDaysOfWeek} (empty = every day). No crew.</li>
 *   <li><b>RELIEF</b> — a relief operator: not auto-scheduled onto any shift; appears only when they
 *       take a coverage signup.</li>
 * </ul>
 */
@Entity
@Table(name = "crew_assignment")
@Getter
@Setter
@NoArgsConstructor
@Where(clause = "deleted IS NOT TRUE")
public class CrewAssignment extends BaseAuditEntity {

    /** Allowed values for {@link #assignmentType}. */
    public static final class Type {
        public static final String ROTATING = "ROTATING";
        public static final String FIXED = "FIXED";
        public static final String RELIEF = "RELIEF";
        private Type() {}
    }

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    /** The crew for ROTATING assignments; null for FIXED / RELIEF. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "crew_id")
    private Crew crew;

    /** Position label (name of a {@link SchedulePosition}) — Lead, CRO, AO, … */
    @Column(name = "position")
    private String position;

    /** One of {@link Type}: ROTATING | FIXED | RELIEF. */
    @Column(name = "assignment_type")
    private String assignmentType;

    /** FIXED only — the shift worked ({@link CrewRotation.Shift#DAY} / {@link CrewRotation.Shift#NIGHT}). */
    @Column(name = "fixed_shift")
    private String fixedShift;

    /** FIXED only — CSV of day-of-week (MON,TUE,…); empty/null = every day. */
    @Column(name = "fixed_days_of_week")
    private String fixedDaysOfWeek;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(name = "is_active")
    private Boolean isActive;
}
