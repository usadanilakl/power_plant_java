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
 * Schedule v2 — a manager (or PTO automation) request for extra headcount on a shift across a date
 * range. One logical seat per (date, shift, seatIndex); open seats = {@code requiredCount} minus
 * approved {@link CoverageSignup}s for that (date, shift). Rendered as coverage chips on the
 * Day/Month/Year views.
 */
@Entity
@Table(name = "coverage_request")
@Getter
@Setter
@NoArgsConstructor
@Where(clause = "deleted IS NOT TRUE")
public class CoverageRequest extends BaseAuditEntity {

    /** Allowed values for {@link #shift}. */
    public static final class ShiftType {
        public static final String DAY = "DAY";
        public static final String NIGHT = "NIGHT";
        private ShiftType() {}
    }

    /** Allowed values for {@link #reason}. */
    public static final class Reason {
        public static final String OUTAGE = "OUTAGE";
        public static final String PTO_COVERAGE = "PTO_COVERAGE";
        public static final String MANUAL = "MANUAL";
        private Reason() {}
    }

    /** Allowed values for {@link #status}. */
    public static final class Status {
        public static final String OPEN = "OPEN";
        public static final String FULFILLED = "FULFILLED";
        public static final String CANCELLED = "CANCELLED";
        private Status() {}
    }

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    /** DAY | NIGHT (see {@link ShiftType}). */
    @Column(name = "shift")
    private String shift;

    /** Extra people needed per day across the range. */
    @Column(name = "required_count")
    private Integer requiredCount;

    /** OUTAGE | PTO_COVERAGE | MANUAL (see {@link Reason}). */
    @Column(name = "reason")
    private String reason;

    /** The PTO request that triggered this coverage, when auto-created (nullable). */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pto_request_id")
    private PtoRequest ptoRequest;

    /** Cached count of approved signups — recomputed by the service on signup transitions. */
    @Column(name = "filled_count")
    private Integer filledCount;

    /** OPEN | FULFILLED | CANCELLED (see {@link Status}). */
    @Column(name = "status")
    private String status;
}
