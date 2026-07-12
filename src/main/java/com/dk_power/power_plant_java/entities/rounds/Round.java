package com.dk_power.power_plant_java.entities.rounds;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * A native operator round — a container of ordered {@link RoundQuestion}s with a native schedule. Replaces the
 * WebView-AMS "Task Template" (BOP / CRO checklist / Unit Outside Rounds, …). Hub-authoritative operational data
 * (a plain {@code @Entity}, like {@link RoundsReading} — not CRDT-synced; the PWA + admin UI hit the hub).
 */
@Entity
@Table(name = "round", indexes = @Index(name = "ix_round_active", columnList = "active, deleted"))
@Getter
@Setter
@NoArgsConstructor
public class Round {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    /** Plant area / grouping (e.g. "Unit 1 Outside"). */
    private String area;

    // ── Native schedule ──────────────────────────────────────────────────────
    @Enumerated(EnumType.STRING)
    private RoundCadence cadence = RoundCadence.PER_SHIFT;

    @Enumerated(EnumType.STRING)
    private RoundShift shift = RoundShift.EITHER;

    /** Interval for CUSTOM cadence. */
    private Integer intervalHours;

    private boolean active = true;

    /** The AMS Task Template this round was imported/mapped from (for re-import matching). */
    private String sourceTemplate;

    private String createdBy;
    private LocalDateTime createdAt;
    private String updatedBy;
    private LocalDateTime updatedAt;
    private boolean deleted = false;

    @OneToMany(mappedBy = "round", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("orderIndex ASC")
    private List<RoundQuestion> questions = new ArrayList<>();
}
