package com.dk_power.power_plant_java.entities.loto;

import com.dk_power.power_plant_java.entities.base_entities.BaseAuditEntity;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * One walkdown session against a LOTO. Multiple crews can each run their own
 * session; the same crew can run multiple sessions across the LOTO's life.
 * Once {@link #completed} flips to {@code true} the row is immutable at the
 * service layer.
 */
@Entity
@Table(name = "walkdown_session", indexes = {
        @Index(name = "idx_walkdown_session_loto", columnList = "loto_id"),
})
@Getter
@Setter
@NoArgsConstructor
public class WalkdownSession extends BaseAuditEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "loto_id", nullable = false)
    private Loto loto;

    /** Free-text crew identifier (e.g. "Day Shift A", "Mechanical Crew"). */
    @Column(name = "crew_name", length = 128)
    private String crewName;

    @Column(name = "started_by", length = 128)
    private String startedBy;

    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Column(name = "completed_by", length = 128)
    private String completedBy;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "completed", nullable = false)
    private boolean completed = false;

    /** Free-text session-level notes captured at start or completion. */
    @Column(name = "session_notes", columnDefinition = "TEXT")
    private String sessionNotes;

    /** JSON map: {pointId: PointState}. */
    @Column(name = "point_states_json", columnDefinition = "TEXT")
    private String pointStatesJson;

    private static final ObjectMapper objectMapper = new ObjectMapper()
            .registerModule(new JavaTimeModule())
            .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

    public Map<Long, PointState> getPointStates() {
        if (pointStatesJson == null || pointStatesJson.isEmpty()) return new HashMap<>();
        try {
            return objectMapper.readValue(pointStatesJson, new TypeReference<Map<Long, PointState>>() {});
        } catch (Exception e) {
            return new HashMap<>();
        }
    }

    public void setPointStates(Map<Long, PointState> states) {
        try {
            this.pointStatesJson = objectMapper.writeValueAsString(states != null ? states : new HashMap<>());
        } catch (Exception e) {
            this.pointStatesJson = "{}";
        }
    }

    @lombok.Data
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class PointState {
        private boolean checked;
        private String checkedBy;
        private String checkedAt;   // ISO string
        private String notes;
    }
}
