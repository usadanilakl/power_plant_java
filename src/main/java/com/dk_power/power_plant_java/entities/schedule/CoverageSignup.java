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
import java.time.LocalDateTime;

/**
 * Schedule v2 — one person taking one open seat on one day of a {@link CoverageRequest}. Approved
 * signups add the person to that day's shift bucket during materialisation.
 *
 * <p>Status churn is bounded (a handful of transitions per signup), so this syncs via CRDT like the
 * other schedule entities. If churn ever becomes a problem, revisit making it hub-owned/local-only.
 */
@Entity
@Table(name = "coverage_signup")
@Getter
@Setter
@NoArgsConstructor
@Where(clause = "deleted IS NOT TRUE")
public class CoverageSignup extends BaseAuditEntity {

    /** Allowed values for {@link #status}. */
    public static final class Status {
        public static final String PENDING = "PENDING";
        public static final String APPROVED = "APPROVED";
        public static final String REJECTED = "REJECTED";
        public static final String WITHDRAWN = "WITHDRAWN";
        private Status() {}
    }

    /** Allowed values for {@link #signedUpVia}. */
    public static final class Via {
        public static final String PWA = "PWA";
        public static final String ELECTRON = "ELECTRON";
        public static final String KIOSK = "KIOSK";
        private Via() {}
    }

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "coverage_request_id")
    private CoverageRequest coverageRequest;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    /** The specific day within the request range this person took. */
    @Column(name = "signup_date")
    private LocalDate date;

    /** DAY | NIGHT — mirrors the parent request's shift (denormalised for per-day queries). */
    @Column(name = "shift")
    private String shift;

    /** PENDING | APPROVED | REJECTED | WITHDRAWN (see {@link Status}). */
    @Column(name = "status")
    private String status;

    /** PWA | ELECTRON | KIOSK (see {@link Via}). */
    @Column(name = "signed_up_via")
    private String signedUpVia;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approved_by_user_id")
    private User approvedBy;

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;
}
