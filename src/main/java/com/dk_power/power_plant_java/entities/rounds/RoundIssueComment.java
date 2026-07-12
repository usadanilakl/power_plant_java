package com.dk_power.power_plant_java.entities.rounds;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/** An additional (optional) observation added to an open {@link RoundIssue} on a later round. */
@Entity
@Table(name = "round_issue_comment", indexes = @Index(name = "ix_round_issue_comment_issue", columnList = "issue_id"))
@Getter
@Setter
@NoArgsConstructor
public class RoundIssueComment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "issue_id")
    @JsonIgnore
    private RoundIssue issue;

    @Column(columnDefinition = "TEXT")
    private String text;

    private String author;
    private LocalDateTime createdAt;

    /** The round instance this comment came from (if any). */
    private Long instanceId;
}
