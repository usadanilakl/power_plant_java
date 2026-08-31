package com.dk_power.power_plant_java.entities.permits;

import com.dk_power.power_plant_java.entities.base_entities.BaseAuditEntity;
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
import org.hibernate.annotations.NotFound;
import org.hibernate.annotations.NotFoundAction;
import org.hibernate.annotations.Where;

import java.time.Instant;

/**
 * One atmosphere test: the readings, when they were taken, by whom, and on what meter.
 *
 * <h2>Why this is a separate entity and not fields on the area</h2>
 *
 * The abandoned {@code Space} entity held one set of readings directly on the row and overwrote
 * them. For air monitoring the <b>history</b> is the artifact: "was this space tested before entry,
 * and what did it read" is a question about a moment, and a single overwritten row cannot answer it
 * for any moment but the last. It also makes "overdue for re-test" computable, which a snapshot
 * never can be.
 *
 * <h2>Readings are Strings</h2>
 *
 * Matching {@code ConfinedSpace}, which stores the same five readings the same way. Field meters
 * report things a number cannot hold — {@code "<0.1"}, {@code "20.9"}, {@code "OR"} for over-range
 * — and silently coercing those to a number would turn "the meter pegged" into a value that looks
 * like a real measurement.
 */
@Entity
@Table(name = "air_test", indexes = {
        // The list screen asks for the newest test per area on every load.
        @Index(name = "idx_air_test_area", columnList = "monitored_area_id, tested_at"),
})
@Getter
@Setter
@NoArgsConstructor
@Where(clause = "deleted IS NOT TRUE")
public class AirTest extends BaseAuditEntity {

    /**
     * Client-generated id for the reading, unique.
     *
     * <p>The field app queues a reading and retries until it gets a success. If the server commits
     * but the response is lost — a dropped connection at exactly the wrong moment, which is the
     * normal case in a basement — the retry would otherwise create a SECOND row for one reading.
     * Making the client name the reading turns the retry into an update of the same row.
     */
    @Column(unique = true)
    private String clientUuid;

    @ManyToOne(fetch = FetchType.LAZY)
    @NotFound(action = NotFoundAction.IGNORE)
    @JoinColumn(name = "monitored_area_id")
    private MonitoredArea monitoredArea;

    /**
     * When the reading was taken — NOT when the row was created. A test recorded from a phone that
     * was offline in a basement lands hours after the fact, and the audit question is always about
     * the moment of the reading.
     */
    private Instant testedAt;

    /** Who took it. Free text: it is often a contractor who has no account here. */
    private String testedBy;

    private String meterModel;
    private String meterSerial;

    private String oxygen;
    private String lel;
    private String hydrogenSulfide;
    private String carbonMonoxide;
    private String ammonia;

    /** PASS | FAIL — the tester's own call, not something derived from the numbers. */
    private String result;

    private String notes;
}
