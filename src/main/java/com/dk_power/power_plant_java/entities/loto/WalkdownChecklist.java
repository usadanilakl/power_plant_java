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
 * A walkdown checklist generated against a specific {@link LotoSnapshot}. Operators
 * tick off each LOTO point as they walk down the equipment to verify zero energy and
 * proper LOTO installation. Once {@link #completed} flips to {@code true}, all
 * mutating operations are rejected at the service layer — the row becomes a permanent
 * audit record.
 */
@Entity
@Table(name = "walkdown_checklist", indexes = {
        @Index(name = "idx_walkdown_loto", columnList = "loto_id"),
        @Index(name = "idx_walkdown_snapshot", columnList = "loto_snapshot_id"),
})
@Getter
@Setter
@NoArgsConstructor
public class WalkdownChecklist extends BaseAuditEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "loto_id", nullable = false)
    private Loto loto;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "loto_snapshot_id")
    private LotoSnapshot lotoSnapshot;

    @Column(name = "requested_by", length = 128)
    private String requestedBy;

    @Column(name = "requested_at")
    private LocalDateTime requestedAt;

    @Column(name = "completed_by", length = 128)
    private String completedBy;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "completed", nullable = false)
    private boolean completed = false;

    @Column(columnDefinition = "TEXT")
    private String notes;

    /** JSON map: {pointId: {checked, checkedBy, checkedAt, notes}} */
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

    /** Per-point state inside the walkdown's points map. */
    @lombok.Data
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class PointState {
        private boolean checked;
        private String checkedBy;
        private String checkedAt;     // ISO string for portability
        private String notes;
    }
}
