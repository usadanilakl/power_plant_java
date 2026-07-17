package com.dk_power.power_plant_java.entities.loto;

import com.dk_power.power_plant_java.entities.base_entities.BaseAuditEntity;
import com.dk_power.power_plant_java.entities.base_entities.BaseIdEntity;
import com.dk_power.power_plant_java.entities.categories.Value;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.DynamicUpdate;
import org.hibernate.annotations.Where;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * {@link DynamicUpdate} closes the write-race window codex flagged on the
 * reactivity fix pass: without it, ANY writer path that loads via unlocked
 * findById (updateStandard, workflow transitions, procedure-text edits,
 * loto-point add/remove, etc.) writes ALL loaded columns on save, including
 * the stale {@code deleted=false} that was in memory before a concurrent
 * {@code deleteStandard} committed {@code deleted=true}. With DynamicUpdate,
 * Hibernate's UPDATE only lists columns the tx actually modified — a
 * concurrent name-edit no longer silently undoes the delete. No @Version
 * introduction needed (kept off per the sync design). Same benefit as the
 * write-amplification fix already applied to PermitAttachment.
 */
@Entity
@Getter
@Setter
@DynamicUpdate
@Where(clause = "deleted IS NOT TRUE")
public class LotoStandard extends BaseAuditEntity {
    @ManyToMany(cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    @JoinTable(
            name = "loto_standard_loto_point",
            joinColumns = @JoinColumn(name = "loto_standard_id"),
            inverseJoinColumns = @JoinColumn(name = "loto_point_id")
    )
    private List<LotoPoint> lotoPoints = new ArrayList<>();

    private String description;

    @Lob
    @Column(columnDefinition = "TEXT")
    private String lotoPointOrder;

    /** JSON map: {pointId: {requiredPointIds, safetyConditions}} */
    @Column(columnDefinition = "TEXT")
    private String pointPrerequisitesJson;

    // ── Procedural prose ─────────────────────────────────────────────────────
    // Free-text fields the qualified employee fills in while developing the standard.
    // Install and removal sides are stored separately. The two original ambiguous
    // fields (prerequisitesText, hazardControlMethodsText) are pinned to the
    // install-side columns so existing rows keep their data.

    /** Install-side prerequisites prose (legacy DB column: prerequisites_text). */
    @Column(name = "prerequisites_text", columnDefinition = "TEXT")
    private String installPrerequisitesText;

    /** Install-side hazard-control methods (legacy DB column: hazard_control_methods_text). */
    @Column(name = "hazard_control_methods_text", columnDefinition = "TEXT")
    private String installHazardControlText;

    /** Install procedure prose. */
    @Column(columnDefinition = "TEXT")
    private String installProcedureText;

    /** Removal-side prerequisites prose. */
    @Column(columnDefinition = "TEXT")
    private String removalPrerequisitesText;

    /** Removal-side hazard-control methods. */
    @Column(columnDefinition = "TEXT")
    private String removalHazardControlText;

    /** Removal procedure prose. */
    @Column(columnDefinition = "TEXT")
    private String removalProcedureText;

    /**
     * When true, the removal procedure's default predecessor graph is the reverse
     * of the install graph. When false (default), removal follows install order.
     * Per-point overrides on {@code PointPrerequisite.removalRequiredPointIds} take
     * precedence over this default.
     */
    private boolean removalReversesInstallOrder = false;

    @ManyToMany(cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    @JoinTable(
            name = "loto_standard_groups",
            joinColumns = @JoinColumn(name = "loto_standard_id"),
            inverseJoinColumns = @JoinColumn(name = "value_id")
    )
    private Set<Value> groups = new HashSet<>();

    // ── Development workflow ─────────────────────────────────────────────────
    /** Current development status (FK to Value, category {@link LotoStandardStatus#CATEGORY}). */
    @ManyToOne(cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    @JoinColumn(name = "development_status_id")
    private Value developmentStatus;

    /** Increments each time the standard is invalidated by modification (NEW reset). */
    @Column(name = "current_version")
    private Integer currentVersion = 1;

    /**
     * Set on the first edit to an APPROVED standard; cleared when a CA/Manager
     * closes the pending-review (either as minor or by requiring re-approval).
     * Drives the "Pending Review" banner in the UI. See loto-procedure.md §3.3.
     */
    @Column(name = "pending_review_since")
    private LocalDateTime pendingReviewSince;

    @Column(name = "submitted_for_verification_by", length = 128)
    private String submittedForVerificationBy;
    @Column(name = "submitted_for_verification_at")
    private LocalDateTime submittedForVerificationAt;

    /** Second qualified person who verified the standard. Must differ from creator. */
    @Column(name = "verified_by", length = 128)
    private String verifiedBy;
    @Column(name = "verified_at")
    private LocalDateTime verifiedAt;

    @Column(name = "walkdown_by", length = 128)
    private String walkdownBy;
    @Column(name = "walkdown_at")
    private LocalDateTime walkdownAt;

    @Column(name = "ready_for_testing_by", length = 128)
    private String readyForTestingBy;
    @Column(name = "ready_for_testing_at")
    private LocalDateTime readyForTestingAt;

    /** Manager who gave final approval. */
    @Column(name = "manager_approved_by", length = 128)
    private String managerApprovedBy;
    @Column(name = "manager_approved_at")
    private LocalDateTime managerApprovedAt;

    /** Clears all attribution fields. Called on NEW reset and when stepping back to DRAFT. */
    public void clearWorkflowAttribution() {
        submittedForVerificationBy = null;
        submittedForVerificationAt = null;
        verifiedBy = null;
        verifiedAt = null;
        walkdownBy = null;
        walkdownAt = null;
        readyForTestingBy = null;
        readyForTestingAt = null;
        managerApprovedBy = null;
        managerApprovedAt = null;
    }

    private static final ObjectMapper objectMapper = new ObjectMapper();


    // Getter
    public Map<String, Integer> getLotoPointOrder() {
        if (lotoPointOrder == null || lotoPointOrder.isEmpty()) {
            return new LinkedHashMap<>();
        }
        try {
            String json = lotoPointOrder;
            // Fix double-serialized JSON (escaped quotes stored in DB)
            if (json.contains("\\\"")) {
                json = json.replace("\\\"", "\"");
            }
            return objectMapper.readValue(json, new TypeReference<Map<String, Integer>>() {
            });
        } catch (IOException e) {
            e.printStackTrace();
            return new LinkedHashMap<>();
        }
    }

    // Setter
    public void setLotoPointOrder(Map<String, Integer> orderMap) {
        try {
            this.lotoPointOrder = objectMapper.writeValueAsString(orderMap);
        } catch (IOException e) {
            e.printStackTrace();
            this.lotoPointOrder = "{}";
        }
    }


    public void addLotoPoint(LotoPoint lotoPoint) {
        if (this.lotoPoints == null) {
            this.lotoPoints = new ArrayList<>();
        }
        this.lotoPoints.add(lotoPoint);
    }

    public void removeLotoPoint(LotoPoint lotoPoint) {
        if (this.lotoPoints != null) {
            this.lotoPoints.remove(lotoPoint);
        }
    }

    public void reorderLotoPoints(List<Long> orderedLotoPointIds) {
        if (orderedLotoPointIds == null || orderedLotoPointIds.isEmpty()) {
            throw new IllegalArgumentException("Ordered LOTO point IDs list cannot be null or empty");
        }

        Set<Long> existingIds = lotoPoints.stream().map(BaseIdEntity::getId).collect(Collectors.toSet());
        if (!existingIds.containsAll(orderedLotoPointIds)) {
            throw new IllegalArgumentException("Some provided LOTO point IDs do not exist in this standard");
        }

        Map<String, Integer> newOrder = new LinkedHashMap<>();
        int order = 1;
        for (Long id : orderedLotoPointIds) {
            newOrder.put(id.toString(), order++);
        }

        setLotoPointOrder(newOrder);

        // Reorder the lotoPoints list based on the new order
        List<LotoPoint> reorderedPoints = new ArrayList<>(lotoPoints);
        reorderedPoints.sort(Comparator.comparingInt(point -> newOrder.getOrDefault(point.getId().toString(), Integer.MAX_VALUE)));
        this.lotoPoints = reorderedPoints;
    }

    public Map<Long, Integer> getLotoPointOrderMap() {
        Map<String, Integer> stringOrderMap = getLotoPointOrder();
        Map<Long, Integer> longOrderMap = new LinkedHashMap<>();

        for (Map.Entry<String, Integer> entry : stringOrderMap.entrySet()) {
            try {
                Long key = Long.parseLong(entry.getKey());
                longOrderMap.put(key, entry.getValue());
            } catch (NumberFormatException e) {
                // Log the error or handle it as appropriate for your application
                System.err.println("Invalid key in lotoPointOrder: " + entry.getKey());
            }
        }

        // If the order map is empty or incomplete, fall back to the list order
        if (longOrderMap.size() != lotoPoints.size()) {
            int order = 1;
            for (LotoPoint point : lotoPoints) {
                if (!longOrderMap.containsKey(point.getId())) {
                    longOrderMap.put(point.getId(), order);
                }
                order++;
            }
        }

        return longOrderMap;
    }

    public List<LotoPoint> getLotoPoints() {
        Map<Long, Integer> orderMap = getLotoPointOrderMap();
        List<LotoPoint> orderedPoints = new ArrayList<>(lotoPoints);
        orderedPoints.sort(Comparator.comparingInt(point -> orderMap.getOrDefault(point.getId(), Integer.MAX_VALUE)));
        return orderedPoints;
    }

    public Map<Long, PointPrerequisite> getPointPrerequisites() {
        if (pointPrerequisitesJson == null || pointPrerequisitesJson.isEmpty()) return new HashMap<>();
        try {
            return objectMapper.readValue(pointPrerequisitesJson,
                    new TypeReference<Map<Long, PointPrerequisite>>() {});
        } catch (IOException e) {
            return new HashMap<>();
        }
    }

    public void setPointPrerequisites(Map<Long, PointPrerequisite> prerequisites) {
        try {
            this.pointPrerequisitesJson = objectMapper.writeValueAsString(prerequisites);
        } catch (IOException e) {
            this.pointPrerequisitesJson = "{}";
        }
    }
}
