package com.dk_power.power_plant_java.entities.rounds;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Staging row for one WebView-AMS round question (a report column), parsed from the header text. The admin
 * processes each of these in the workbench: review the parse, create/assign a PhysicalObject, and generate an
 * editable {@link RoundQuestion} (linked back via {@code sourceWebviewKey}). Re-imports upsert by that key so an
 * already-processed row isn't clobbered — only {@code changedSinceProcessed} is flagged when the header shifts.
 */
@Entity
@Table(name = "imported_round_question",
        uniqueConstraints = @UniqueConstraint(name = "uk_imported_rq_key", columnNames = "sourceWebviewKey"),
        indexes = @Index(name = "ix_imported_rq_status", columnList = "status"))
@Getter
@Setter
@NoArgsConstructor
public class ImportedRoundQuestion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Ordinal-stripped header — stable de-dupe/link key (same scheme as RoundsReading.questionKey). */
    @Column(nullable = false, length = 512)
    private String sourceWebviewKey;

    /** Full original header text. */
    @Column(columnDefinition = "TEXT")
    private String sourceRaw;

    // ── Parsed hints (admin can override in the workbench) ─────────────────────
    private String category;
    private String tagCode;
    @Column(columnDefinition = "TEXT")
    private String prompt;
    private Double lowLimit;
    private Double highLimit;
    private String unit;
    @Enumerated(EnumType.STRING)
    private RoundAnswerType suggestedType;

    /** For PASS_FAIL/CHOICE: the value that counts as "normal/pass" (from alarm config or the sample response). */
    private String expectedValue;
    /** A real recent answer (Excel col C) — drives the type/unit guess; kept for reference. */
    private String sampleValue;
    /** The raw alarm-config text (Excel col D) — the authoritative abnormal condition; kept for reference. */
    @Column(columnDefinition = "TEXT")
    private String alarmConfigRaw;
    /** Human round name derived from the source (e.g. "BOP Outside Rounds") — which round this question belongs to. */
    private String sourceRound;

    // ── Processing state ───────────────────────────────────────────────────────
    /** NEW / PROCESSED / IGNORED. */
    @Column(length = 16)
    private String status = "NEW";

    /** The RoundQuestion generated from this staging row (once processed). */
    private Long generatedQuestionId;

    /** True when a re-import saw a different header for an already-processed key (needs review). */
    private boolean changedSinceProcessed = false;

    private Long sourceReportId;
    private String scrapedAt;
    private LocalDateTime importedAt;
    private LocalDateTime updatedAt;
}
