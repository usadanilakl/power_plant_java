package com.dk_power.power_plant_java.entities.loto;

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
 * Mobile (PWA) verification / walkdown checklist captured against one {@link LotoStandard}.
 *
 * <p>This is <b>hub-local evidence</b>, intentionally a plain JPA entity (NOT a {@code BaseIdEntity}):
 * it is written and read only by Plant staff through the PWA, which talks directly to the hub. Keeping it
 * off the CRDT sync path avoids entangling a brand-new entity type in field-change emission/apply. The
 * <i>official</i> outcome of a walkdown (verified / walkdown-complete + who + when) still flows through the
 * standard's own lifecycle transition and its immutable {@code LotoStandardApprovalEvent}, both of which sync.</p>
 *
 * <p>One row per standard (see {@code standardId} unique index). The checklist is working evidence for the
 * standard's <i>current</i> version; a version bump / send-back-to-draft resets it.</p>
 */
@Entity
@Table(name = "loto_standard_walkdown",
        uniqueConstraints = @UniqueConstraint(name = "uq_lsw_standard", columnNames = "standard_id"),
        indexes = @Index(name = "idx_lsw_standard", columnList = "standard_id"))
@Getter
@Setter
@NoArgsConstructor
public class LotoStandardWalkdown {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "standard_id", nullable = false)
    private Long standardId;

    /** The standard version this checklist was captured against (evidence is per-version). */
    @Column(name = "standard_version")
    private Integer standardVersion;

    @Column(name = "started_by", length = 128)
    private String startedBy;

    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Column(name = "updated_by", length = 128)
    private String updatedBy;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    /** JSON map: {globalItemKey: GlobalItem}. Keys are the fixed set in {@code GlobalItemKey}. */
    @Column(name = "global_items_json", columnDefinition = "TEXT")
    private String globalItemsJson;

    /** JSON map: {lotoPointId: PointChecklist}. */
    @Column(name = "point_results_json", columnDefinition = "TEXT")
    private String pointResultsJson;

    private static final ObjectMapper objectMapper = new ObjectMapper()
            .registerModule(new JavaTimeModule())
            .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

    public Map<String, GlobalItem> getGlobalItems() {
        if (globalItemsJson == null || globalItemsJson.isEmpty()) return new HashMap<>();
        try {
            return objectMapper.readValue(globalItemsJson, new TypeReference<Map<String, GlobalItem>>() {});
        } catch (Exception e) {
            return new HashMap<>();
        }
    }

    public void setGlobalItems(Map<String, GlobalItem> items) {
        try {
            this.globalItemsJson = objectMapper.writeValueAsString(items != null ? items : new HashMap<>());
        } catch (Exception e) {
            this.globalItemsJson = "{}";
        }
    }

    public Map<Long, PointChecklist> getPointResults() {
        if (pointResultsJson == null || pointResultsJson.isEmpty()) return new HashMap<>();
        try {
            return objectMapper.readValue(pointResultsJson, new TypeReference<Map<Long, PointChecklist>>() {});
        } catch (Exception e) {
            return new HashMap<>();
        }
    }

    public void setPointResults(Map<Long, PointChecklist> results) {
        try {
            this.pointResultsJson = objectMapper.writeValueAsString(results != null ? results : new HashMap<>());
        } catch (Exception e) {
            this.pointResultsJson = "{}";
        }
    }

    /** A checkmark against a global (standard-level) item: the name, or one of the procedure prose blocks. */
    @lombok.Data
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class GlobalItem {
        private boolean checked;
        private String checkedBy;
        private String checkedAt;   // ISO string
        private String notes;
    }

    /**
     * Per-point field walkdown. Each check is tri-state {@link Boolean}: {@code null} = not yet
     * answered, {@code true} = pass, {@code false} = fail. Any {@code false} ("negative") requires
     * a comment. Stored as a JSON blob so adding new fields is additive — old rows come back with
     * the new fields null (unanswered) and the completeness / negative helpers pick them up
     * without a migration.
     */
    @lombok.Data
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class PointChecklist {
        private Boolean fileReferenceProvided;
        private Boolean metalTagPresent;
        private Boolean equipmentAccessible;
        private Boolean tagNumbersMatch;
        private Boolean isolationPositionCorrect;
        private Boolean restoredPositionCorrect;
        /** Value dropdown on the LotoPoint — the general Location Value id looks correct in the field. */
        private Boolean locationCorrect;
        /** Free-text specificLocation on the LotoPoint — the on-site landmark matches what's on the point. */
        private Boolean specificLocationCorrect;
        private Boolean equipmentLockable;
        private Boolean zeroEnergyAdequate;
        private String comment;
        private String checkedBy;
        private String checkedAt;   // ISO string
    }
}
