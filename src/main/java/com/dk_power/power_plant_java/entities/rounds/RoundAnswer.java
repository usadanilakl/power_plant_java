package com.dk_power.power_plant_java.entities.rounds;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * An operator's answer to one {@link RoundQuestion} within a {@link RoundInstance}. Out-of-range detection and the
 * {@link RoundIssue} link are reconciled server-side on submit (not while typing).
 */
@Entity
@Table(name = "round_answer", indexes = {
        @Index(name = "ix_round_answer_instance", columnList = "instance_id"),
        @Index(name = "ix_round_answer_question", columnList = "questionId, answeredAt")
})
@Getter
@Setter
@NoArgsConstructor
public class RoundAnswer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "instance_id")
    @JsonIgnore
    private RoundInstance instance;

    private Long questionId;

    /** Raw answer text. ("value" is reserved in H2 — use a safe column name.) */
    @Column(name = "answer_value", columnDefinition = "TEXT")
    private String value;

    /** Parsed numeric value for READING questions (null otherwise). */
    private Double numericValue;

    /** Set on submit when the answer is abnormal (out of limits / not the expected pass value). */
    private boolean outOfRange = false;

    /** The RoundIssue this answer opened or was attached to (null when normal). */
    private Long issueId;

    @Column(columnDefinition = "TEXT")
    private String comment;

    private LocalDateTime answeredAt;
}
