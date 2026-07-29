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
 * Schedule v2 — a day-level annotation (holiday, meeting, pay-period marker, outage window, …)
 * spanning a date range. The materialiser folds overlapping events into each {@link
 * com.dk_power.power_plant_java.entities.users.ShiftDay}'s {@code eventFlagsJson} so all consumer
 * surfaces (PWA / Electron / kiosk) can render banners and icons without a second query.
 */
@Entity
@Table(name = "schedule_event")
@Getter
@Setter
@NoArgsConstructor
@Where(clause = "deleted IS NOT TRUE")
public class ScheduleEvent extends BaseAuditEntity {

    /** Allowed values for {@link #eventType}. */
    public static final class Type {
        public static final String HOLIDAY = "HOLIDAY";
        public static final String MEETING = "MEETING";
        public static final String PAY_PERIOD_START = "PAY_PERIOD_START";
        public static final String OUTAGE = "OUTAGE";
        public static final String TRAINING_MANDATORY = "TRAINING_MANDATORY";
        public static final String LEADS_MEETING = "LEADS_MEETING";
        private Type() {}
    }

    /** One of {@link Type}. */
    @Column(name = "event_type")
    private String eventType;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(name = "title")
    private String title;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    /** Optional hex colour override; UI falls back to a per-type default when null. */
    @Column(name = "color")
    private String color;

    /** DAY | NIGHT | BOTH | null — which shift the event affects (null = day-level, both). */
    @Column(name = "applies_to_shift")
    private String appliesToShift;
}
