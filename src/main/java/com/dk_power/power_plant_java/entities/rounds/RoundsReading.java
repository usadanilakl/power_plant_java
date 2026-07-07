package com.dk_power.power_plant_java.entities.rounds;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * One numeric reading for a single round question on a single shift — the
 * normalized, query-friendly projection behind the WebView AMS trend tool.
 *
 * <p><b>Deliberately a plain {@code @Entity}</b> (NOT {@code BaseIdEntity}): it
 * is a LOCAL materialized view derived from the already-synced
 * {@link RoundsReport} snapshots, so it must stay OUT of the CRDT sync flow.
 * Each node rebuilds/upserts its own copy from the snapshots it holds. Keyed by
 * {@code (questionKey, shiftDate, shift)} so re-extracting the same shift from
 * any snapshot/device collapses to one row (last scrape wins), with no
 * cross-device duplication.
 */
@Entity
@Table(
    name = "rounds_reading",
    uniqueConstraints = @UniqueConstraint(
        name = "uk_rounds_reading_key",
        columnNames = {"questionKey", "shiftDate", "shift"}),
    indexes = {
        @Index(name = "ix_rounds_reading_series", columnList = "questionKey, shiftTime"),
        @Index(name = "ix_rounds_reading_time", columnList = "shiftTime")
    })
@Getter
@Setter
@NoArgsConstructor
public class RoundsReading {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Ordinal-stripped column header — stable identity across checklist growth. */
    @Column(nullable = false, length = 512)
    private String questionKey;

    /** Latest full header text seen for this question (may carry a "(N)" ordinal). */
    @Column(length = 512)
    private String questionLabel;

    /** Best-effort grouping label (section prefix), for the series picker. */
    @Column(length = 256)
    private String category;

    /** Best-effort unit parsed from the header (psig, psi, %, inch…); may be null. */
    @Column(length = 32)
    private String unit;

    /** Owning shift's date (post-midnight Night rolls into the previous day). */
    @Column(nullable = false)
    private LocalDate shiftDate;

    /** "Day" or "Night". */
    @Column(nullable = false, length = 8)
    private String shift;

    /** Representative instant for the x-axis: shiftDate at 06:00 (Day) / 18:00 (Night). */
    @Column(nullable = false)
    private LocalDateTime shiftTime;

    /** Parsed numeric value. */
    private double value;

    /** Original cell text (kept for display / audit). */
    @Column(length = 128)
    private String rawValue;

    /** scrapedAt of the snapshot this reading came from — the last-writer-wins tiebreak. */
    @Column(length = 40)
    private String scrapedAt;
}
