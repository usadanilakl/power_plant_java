package com.dk_power.power_plant_java.entities.rounds;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * One checkpoint in a {@link Round}: a prompt + how it's answered + (optionally) the {@link
 * com.dk_power.power_plant_java.entities.physical.PhysicalObject} it's about, so the operator gets that object's
 * full context. Out-of-range behaviour is settable per question (limits / expected value / whether to track issues).
 * Linked to its WebView-AMS original via {@code sourceWebviewKey} so re-import never clobbers local edits.
 */
@Entity
@Table(name = "round_question", indexes = {
        @Index(name = "ix_round_question_round", columnList = "round_id, orderIndex"),
        @Index(name = "ix_round_question_srckey", columnList = "sourceWebviewKey"),
        @Index(name = "ix_round_question_po", columnList = "physicalObjectId")
})
@Getter
@Setter
@NoArgsConstructor
public class RoundQuestion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "round_id")
    @JsonIgnore
    private Round round;

    private Integer orderIndex;

    @Column(columnDefinition = "TEXT")
    private String prompt;

    @Enumerated(EnumType.STRING)
    private RoundAnswerType answerType = RoundAnswerType.TEXT;

    /** Nullable soft-FK to the PhysicalObject this checkpoint is about (mirrors FileObject.physicalObjectId). */
    private Long physicalObjectId;

    /** Parsed tag/location code from the source header (e.g. "01-CEMS") — kept even before a PhysicalObject is linked. */
    private String tagCode;

    private String unit;

    /** READING out-of-range bounds (either may be null for one-sided limits). */
    private Double lowLimit;
    private Double highLimit;

    /** PASS_FAIL expected/"good" answer. */
    private String expectedValue;

    /** Whether an abnormal answer opens/attaches a {@link RoundIssue}. */
    private boolean trackIssues = true;

    /** JSON array of options for CHOICE / SELECTOR. */
    @Column(columnDefinition = "TEXT")
    private String choicesJson;

    private String category;

    /** If set (a stable OrderCatalogItem itemKey), a LOW reading on this question raises a reorder suggestion. */
    private String reorderCatalogKey;

    // ── Conditional display (dependency) ──
    /** If set, this question only shows when the predecessor's answer satisfies {@code showWhenOp}/{@code showWhenValue}. */
    private Long predecessorQuestionId;
    /** EQUALS | NOT_EQUALS | ANSWERED (how the predecessor's answer gates this question). Null → ANSWERED. */
    private String showWhenOp;
    /** The predecessor answer to compare against (for EQUALS / NOT_EQUALS). */
    private String showWhenValue;

    /** Ordinal-stripped source header — stable link to the WebView-AMS original. */
    @Column(length = 512)
    private String sourceWebviewKey;

    /** The original header text, for reference. */
    @Column(columnDefinition = "TEXT")
    private String sourceWebviewRaw;

    private boolean deleted = false;
}
