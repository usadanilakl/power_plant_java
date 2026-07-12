package com.dk_power.power_plant_java.entities.rounds;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * A persistent out-of-range issue on a {@link RoundQuestion}. Opens (with a REQUIRED first comment) the first time
 * a reading goes abnormal; stays OPEN across subsequent rounds (no new comment required — just re-observed) until a
 * later round submits a normal reading, which auto-RESOLVES it. A re-occurrence opens a NEW issue. Powers the
 * "Active Out-of-Range" dashboard.
 */
@Entity
@Table(name = "round_issue", indexes = {
        @Index(name = "ix_round_issue_open", columnList = "status, questionId"),
        @Index(name = "ix_round_issue_po", columnList = "physicalObjectId, status")
})
@Getter
@Setter
@NoArgsConstructor
public class RoundIssue {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long questionId;

    /** Denormalised from the question, for grouping the dashboard by object/area. */
    private Long physicalObjectId;
    @Column(columnDefinition = "TEXT")
    private String questionPrompt;
    private String category;
    private String unit;

    @Enumerated(EnumType.STRING)
    private RoundIssueStatus status = RoundIssueStatus.OPEN;

    private LocalDateTime openedAt;
    private String openedBy;
    private Long openingInstanceId;

    /** Required when the issue is opened. */
    @Column(columnDefinition = "TEXT")
    private String firstComment;

    /** Updated each time the issue is re-observed still-abnormal. */
    private LocalDateTime lastSeenAt;
    private String lastValue;

    private LocalDateTime resolvedAt;
    private String resolvedBy;
    private Long resolvingInstanceId;

    @OneToMany(mappedBy = "issue", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("createdAt ASC")
    private List<RoundIssueComment> comments = new ArrayList<>();
}
