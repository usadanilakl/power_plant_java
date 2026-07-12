package com.dk_power.power_plant_java.entities.rounds;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * One performed round — created when an operator "grabs" a due round (IN_PROGRESS), then SUBMITTED with its
 * answers. The answers are the readings history (native replacement for the WebView trend rows).
 */
@Entity
@Table(name = "round_instance", indexes = {
        @Index(name = "ix_round_instance_round", columnList = "roundId, startedAt"),
        @Index(name = "ix_round_instance_status", columnList = "status")
})
@Getter
@Setter
@NoArgsConstructor
public class RoundInstance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long roundId;

    /** Denormalised round name at the time it was performed (the round definition may change later). */
    private String roundName;

    private String performedBy;
    private LocalDateTime startedAt;
    private LocalDateTime submittedAt;

    @Enumerated(EnumType.STRING)
    private RoundInstanceStatus status = RoundInstanceStatus.IN_PROGRESS;

    /** "Day" / "Night" captured for the round. */
    private String shift;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @OneToMany(mappedBy = "instance", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<RoundAnswer> answers = new ArrayList<>();
}
