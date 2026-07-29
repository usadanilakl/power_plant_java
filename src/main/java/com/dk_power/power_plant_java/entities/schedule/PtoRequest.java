package com.dk_power.power_plant_java.entities.schedule;

import com.dk_power.power_plant_java.entities.base_entities.BaseAuditEntity;
import com.dk_power.power_plant_java.entities.users.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Index;
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
 * Schedule v2 — a time-off request, typically ingested from a forwarded workforce-system approval
 * email (see {@code PtoIntakeService}, Phase 4). When APPROVED, the materialiser sets the user's
 * cells to {@code P} across the range and coverage requests are auto-created for the shifts they
 * would have worked.
 *
 * <p>Dedup keys ({@link #sourceRequestId}, {@link #dedupHash}) are <b>indexed but not DB-unique</b>
 * on purpose: a hard unique constraint would break CRDT apply if two nodes independently mint rows
 * with the same hash under different IDs. Dedup is enforced in the service layer via an
 * {@code existsBy...} guard before save; the indexes just make that lookup cheap.
 */
@Entity
@Table(name = "pto_request",
       indexes = {
           @Index(name = "idx_pto_source_request_id", columnList = "source_request_id"),
           @Index(name = "idx_pto_dedup_hash", columnList = "dedup_hash"),
           @Index(name = "idx_pto_user", columnList = "user_id")
       })
@Getter
@Setter
@NoArgsConstructor
@Where(clause = "deleted IS NOT TRUE")
public class PtoRequest extends BaseAuditEntity {

    /** Allowed values for {@link #status}. */
    public static final class Status {
        public static final String PENDING = "PENDING";
        public static final String APPROVED = "APPROVED";
        public static final String REJECTED = "REJECTED";
        /** Name resolved below the fuzzy-match confidence floor — needs a human to map the user. */
        public static final String PENDING_MANUAL_REVIEW = "PENDING_MANUAL_REVIEW";
        private Status() {}
    }

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    /** EMAIL | APP. */
    @Column(name = "submitted_via")
    private String submittedVia;

    /** Graph {@code internetMessageId} of the source email — audit + secondary dedup signal. */
    @Column(name = "email_message_id")
    private String emailMessageId;

    /** External workforce-system request id (from {@code ShowPage.do?id=N}) — primary dedup key. */
    @Column(name = "source_request_id")
    private String sourceRequestId;

    /** SHA-256 of {@code userId|startDate|endDate} — fallback dedup key when the URL didn't parse. */
    @Column(name = "dedup_hash")
    private String dedupHash;

    /** One of {@link Status}. */
    @Column(name = "status")
    private String status;

    /** When the "cover me?" email to affected coworkers went out (null = not sent yet). */
    @Column(name = "coverage_email_sent_at")
    private LocalDateTime coverageEmailSentAt;
}
