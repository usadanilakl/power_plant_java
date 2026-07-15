package com.dk_power.power_plant_java.entities.loto;


import com.dk_power.power_plant_java.dto.permits.loto_point.LotoPointIdDto;
import com.dk_power.power_plant_java.entities.base_entities.BaseAuditEntity;
import com.dk_power.power_plant_java.enums.Status;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.Set;

@Entity
@Getter
@Setter
@NoArgsConstructor
public class LotoSnapshot extends BaseAuditEntity implements Cloneable {



    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "loto_id", unique = false)
    private Loto loto;

    private String boxNumber;
    @Column(columnDefinition = "TEXT")
    private String locks;
    private String requestorName;
    private String workAuthority;
    private LocalDateTime requestTime;
    private LocalDateTime workAuthorityTime;
    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private Status status;
    private String workScope;

    @Column(columnDefinition = "TEXT")
    private String personnelSnapshot;

    private String snapshotReason;

    /**
     * Monotonic per-permit sequence number, assigned at creation time and SYNCED (unlike
     * {@code dateCreated}, which is excluded from field-sync and re-minted by {@code @PrePersist}
     * on the receiver at apply time). {@code Loto.getLatestSnapshot()} orders by this so a
     * multi-snapshot permit (Test/Modification) resolves the same "current" snapshot on every
     * device regardless of the order snapshots happen to be applied in. Null on legacy rows
     * created before this field existed — the getter falls back to {@code dateCreated} for those.
     */
    private Integer snapshotSeq;

    // ---- Lifecycle event fields (each populated only on the snapshot that recorded that event) ----

    private String caApprovedForHangingBy;
    private LocalDateTime caApprovedForHangingAt;

    private String caActivatedBy;
    private LocalDateTime caActivatedAt;

    private String hungBy;
    private LocalDateTime hungAt;

    private String verifiedBy;
    private LocalDateTime verifiedAt;

    private String activatedBy;
    private LocalDateTime activatedAt;

    private String testStartedBy;
    private LocalDateTime testStartedAt;

    private String reactivatedBy;
    private LocalDateTime reactivatedAt;

    private String transferredFrom;
    private String transferredTo;
    private LocalDateTime transferredAt;

    private String acceptedBy;
    private LocalDateTime acceptedAt;

    private String requestorReleasedBy;
    private LocalDateTime requestorReleasedAt;

    private String controlAuthorityReleasedBy;
    private LocalDateTime controlAuthorityReleasedAt;

    private String locksRemovedBy;
    private LocalDateTime locksRemovedAt;

    private String closedBy;
    private LocalDateTime closedAt;

    // ---- Per-point hung / verified state (JSON maps: pointId -> userName / ISO timestamp) ----

    @Column(columnDefinition = "TEXT")
    private String pointHungByJson;

    @Column(columnDefinition = "TEXT")
    private String pointHungAtJson;

    @Column(columnDefinition = "TEXT")
    private String pointVerifiedByJson;

    @Column(columnDefinition = "TEXT")
    private String pointVerifiedAtJson;

    /** Per-point notes captured during the guided hang procedure. */
    @Column(columnDefinition = "TEXT")
    private String pointHangNotesJson;

    /** Per-point notes captured during the guided verify procedure. */
    @Column(columnDefinition = "TEXT")
    private String pointVerifyNotesJson;

    @Column(columnDefinition = "TEXT")
    private String pointWalkdownByJson;

    @Column(columnDefinition = "TEXT")
    private String pointWalkdownAtJson;

    /** Per-point notes captured during walkdown. */
    @Column(columnDefinition = "TEXT")
    private String pointWalkdownNotesJson;

    /** Per-point removal state — populated as the operator clicks "Mark Removed" after CA release. */
    @Column(columnDefinition = "TEXT")
    private String pointRemovedByJson;

    @Column(columnDefinition = "TEXT")
    private String pointRemovedAtJson;

    @Column(columnDefinition = "TEXT")
    private String pointRemovedNotesJson;

    /**
     * Snapshot of the standard's "removal reverses install order" flag at flip time.
     * When true, points with no explicit removalRequiredPointIds are treated as having
     * the reverse-of-install predecessor graph.
     */
    private boolean removalReversesInstallOrder = false;

    /**
     * JSON-encoded set of point IDs that need re-hanging. Populated when a point is
     * added during Modification, or when a point's lock is pulled during Test. Cleared
     * when the point is re-hung. Drives the resume-from-Mod/Test gate (CA re-activate
     * is blocked until this is empty).
     */
    @Column(columnDefinition = "TEXT")
    private String pointNeedsRehangJson;

    /** JSON map: {pointId: {requiredPointIds, safetyConditions}} — copied from LotoStandard, editable per instance */
    @Column(columnDefinition = "TEXT")
    private String pointPrerequisitesJson;

    @ElementCollection
    @CollectionTable(name = "loto_snapshot_points", joinColumns = @JoinColumn(name = "loto_snapshot_id"))
    @Column(name = "loto_point_data", columnDefinition = "TEXT")
    private Set<String> lotoPointsData = new HashSet<>();

    @Lob
    @Column(columnDefinition = "TEXT")
    private String lotoPointOrder;



    private static final ObjectMapper objectMapper = new ObjectMapper()
            .registerModule(new JavaTimeModule());

    public Set<LotoPointIdDto> getLotoPointDtos() {
        // LinkedHashSet — deterministic iteration so callers that don't apply
        // their own sort still get a stable order across queries. The Loto's
        // authored order lives on {@code lotoPointOrder} and is applied by
        // {@code Loto.getLotoPoints()}, but everything else that iterates
        // this set (paper forms, PDF exports, sync export, LOTO board table)
        // should also see something reproducible.
        Set<LotoPointIdDto> dtos = new LinkedHashSet<>();

        for (String jsonData : lotoPointsData) {
            try {
                LotoPointIdDto dto = objectMapper.readValue(jsonData, LotoPointIdDto.class);
                dtos.add(dto);
            } catch (JsonProcessingException e) {
                e.printStackTrace();
            }
        }

        return dtos;
    }

    public void setLotoPointDtos(Set<LotoPointIdDto> dtos) {
        lotoPointsData = new HashSet<>();

        for (LotoPointIdDto dto : dtos) {
            try {
                String jsonData = objectMapper.writeValueAsString(dto);
                lotoPointsData.add(jsonData);
            } catch (JsonProcessingException e) {
                e.printStackTrace();
            }
        }
    }

    @Override
    public Object clone() throws CloneNotSupportedException {
        LotoSnapshot cloned = (LotoSnapshot) super.clone();
        if (this.lotoPointsData != null) {
            cloned.lotoPointsData = new HashSet<>(this.lotoPointsData);
        }
        return cloned;
    }

    /**
     * Clears aggregate event-recording fields (single who/when per LOTO event). Called after
     * a snapshot is duplicated so each aggregate event stays tied to the snapshot row that
     * recorded it rather than getting copied forward.
     *
     * <p><b>Per-point maps are intentionally NOT cleared</b> — they represent ongoing
     * operational state (which points are currently hung/verified/walked-down/removed) and
     * must persist across snapshot duplications. Without this, post-activation operations
     * like per-point removal lose history because every call duplicates the snapshot.
     */
    public void clearLifecycleEventFields() {
        caApprovedForHangingBy = null;       caApprovedForHangingAt = null;
        caActivatedBy = null;                caActivatedAt = null;
        hungBy = null;                       hungAt = null;
        verifiedBy = null;                   verifiedAt = null;
        activatedBy = null;                  activatedAt = null;
        testStartedBy = null;                testStartedAt = null;
        reactivatedBy = null;                reactivatedAt = null;
        transferredFrom = null;              transferredTo = null;            transferredAt = null;
        acceptedBy = null;                   acceptedAt = null;
        requestorReleasedBy = null;          requestorReleasedAt = null;
        controlAuthorityReleasedBy = null;   controlAuthorityReleasedAt = null;
        locksRemovedBy = null;               locksRemovedAt = null;
        closedBy = null;                     closedAt = null;
        snapshotReason = null;
    }

    // ---- JSON map helpers for per-point state ----

    private static java.util.Map<Long, String> readJsonMap(String json) {
        if (json == null || json.isEmpty()) return new java.util.HashMap<>();
        try {
            return objectMapper.readValue(json, new com.fasterxml.jackson.core.type.TypeReference<java.util.Map<Long, String>>() {});
        } catch (Exception e) {
            return new java.util.HashMap<>();
        }
    }

    private static String writeJsonMap(java.util.Map<Long, String> m) {
        try {
            return objectMapper.writeValueAsString(m);
        } catch (Exception e) {
            return "{}";
        }
    }

    public java.util.Map<Long, String> getPointHungBy()        { return readJsonMap(pointHungByJson); }
    public java.util.Map<Long, String> getPointHungAt()        { return readJsonMap(pointHungAtJson); }
    public java.util.Map<Long, String> getPointHangNotes()     { return readJsonMap(pointHangNotesJson); }
    public java.util.Map<Long, String> getPointVerifiedBy()    { return readJsonMap(pointVerifiedByJson); }
    public java.util.Map<Long, String> getPointVerifiedAt()    { return readJsonMap(pointVerifiedAtJson); }
    public java.util.Map<Long, String> getPointVerifyNotes()   { return readJsonMap(pointVerifyNotesJson); }
    public java.util.Map<Long, String> getPointWalkdownBy()    { return readJsonMap(pointWalkdownByJson); }
    public java.util.Map<Long, String> getPointWalkdownAt()    { return readJsonMap(pointWalkdownAtJson); }
    public java.util.Map<Long, String> getPointWalkdownNotes() { return readJsonMap(pointWalkdownNotesJson); }

    public void setPointHungBy(Long pointId, String user, String notes) {
        java.util.Map<Long, String> by = getPointHungBy();
        java.util.Map<Long, String> at = getPointHungAt();
        java.util.Map<Long, String> nt = getPointHangNotes();
        by.put(pointId, user);
        at.put(pointId, java.time.LocalDateTime.now().toString());
        if (notes != null && !notes.isBlank()) nt.put(pointId, notes); else nt.remove(pointId);
        pointHungByJson = writeJsonMap(by);
        pointHungAtJson = writeJsonMap(at);
        pointHangNotesJson = writeJsonMap(nt);
    }

    public void clearPointHung(Long pointId) {
        java.util.Map<Long, String> by = getPointHungBy(); by.remove(pointId); pointHungByJson = writeJsonMap(by);
        java.util.Map<Long, String> at = getPointHungAt(); at.remove(pointId); pointHungAtJson = writeJsonMap(at);
        java.util.Map<Long, String> nt = getPointHangNotes(); nt.remove(pointId); pointHangNotesJson = writeJsonMap(nt);
    }

    public void setPointVerifiedBy(Long pointId, String user, String notes) {
        java.util.Map<Long, String> by = getPointVerifiedBy();
        java.util.Map<Long, String> at = getPointVerifiedAt();
        java.util.Map<Long, String> nt = getPointVerifyNotes();
        by.put(pointId, user);
        at.put(pointId, java.time.LocalDateTime.now().toString());
        if (notes != null && !notes.isBlank()) nt.put(pointId, notes); else nt.remove(pointId);
        pointVerifiedByJson = writeJsonMap(by);
        pointVerifiedAtJson = writeJsonMap(at);
        pointVerifyNotesJson = writeJsonMap(nt);
    }

    public void clearPointVerified(Long pointId) {
        java.util.Map<Long, String> by = getPointVerifiedBy(); by.remove(pointId); pointVerifiedByJson = writeJsonMap(by);
        java.util.Map<Long, String> at = getPointVerifiedAt(); at.remove(pointId); pointVerifiedAtJson = writeJsonMap(at);
        java.util.Map<Long, String> nt = getPointVerifyNotes(); nt.remove(pointId); pointVerifyNotesJson = writeJsonMap(nt);
    }

    public void setPointWalkdownBy(Long pointId, String user, String notes) {
        java.util.Map<Long, String> by = getPointWalkdownBy();
        java.util.Map<Long, String> at = getPointWalkdownAt();
        java.util.Map<Long, String> nt = getPointWalkdownNotes();
        by.put(pointId, user);
        at.put(pointId, java.time.LocalDateTime.now().toString());
        if (notes != null && !notes.isBlank()) nt.put(pointId, notes); else nt.remove(pointId);
        pointWalkdownByJson = writeJsonMap(by);
        pointWalkdownAtJson = writeJsonMap(at);
        pointWalkdownNotesJson = writeJsonMap(nt);
    }

    public void clearPointWalkdown(Long pointId) {
        java.util.Map<Long, String> by = getPointWalkdownBy(); by.remove(pointId); pointWalkdownByJson = writeJsonMap(by);
        java.util.Map<Long, String> at = getPointWalkdownAt(); at.remove(pointId); pointWalkdownAtJson = writeJsonMap(at);
        java.util.Map<Long, String> nt = getPointWalkdownNotes(); nt.remove(pointId); pointWalkdownNotesJson = writeJsonMap(nt);
    }

    public java.util.Map<Long, String> getPointRemovedBy()    { return readJsonMap(pointRemovedByJson); }
    public java.util.Map<Long, String> getPointRemovedAt()    { return readJsonMap(pointRemovedAtJson); }
    public java.util.Map<Long, String> getPointRemovedNotes() { return readJsonMap(pointRemovedNotesJson); }

    public void setPointRemovedBy(Long pointId, String user, String notes) {
        java.util.Map<Long, String> by = getPointRemovedBy();
        java.util.Map<Long, String> at = getPointRemovedAt();
        java.util.Map<Long, String> nt = getPointRemovedNotes();
        by.put(pointId, user);
        at.put(pointId, java.time.LocalDateTime.now().toString());
        if (notes != null && !notes.isBlank()) nt.put(pointId, notes); else nt.remove(pointId);
        pointRemovedByJson = writeJsonMap(by);
        pointRemovedAtJson = writeJsonMap(at);
        pointRemovedNotesJson = writeJsonMap(nt);
    }

    public void clearPointRemoved(Long pointId) {
        java.util.Map<Long, String> by = getPointRemovedBy(); by.remove(pointId); pointRemovedByJson = writeJsonMap(by);
        java.util.Map<Long, String> at = getPointRemovedAt(); at.remove(pointId); pointRemovedAtJson = writeJsonMap(at);
        java.util.Map<Long, String> nt = getPointRemovedNotes(); nt.remove(pointId); pointRemovedNotesJson = writeJsonMap(nt);
    }

    /**
     * Effective removal predecessors for a point on this snapshot.
     * Resolution order: explicit per-point override → reverse-of-install graph
     * (when {@link #removalReversesInstallOrder} is true) → install predecessors.
     */
    public java.util.List<Long> effectiveRemovalPredecessors(Long pointId) {
        java.util.Map<Long, PointPrerequisite> prereqs = getPointPrerequisites();
        PointPrerequisite spec = prereqs.get(pointId);
        if (spec != null && spec.getRemovalRequiredPointIds() != null
                && !spec.getRemovalRequiredPointIds().isEmpty()) {
            return spec.getRemovalRequiredPointIds();
        }
        if (removalReversesInstallOrder) {
            // Reverse graph: this point's "removal predecessors" are the points whose
            // install predecessors list contains THIS point.
            java.util.List<Long> reversed = new java.util.ArrayList<>();
            for (var entry : prereqs.entrySet()) {
                if (entry.getKey().equals(pointId)) continue;
                PointPrerequisite other = entry.getValue();
                if (other == null || other.getInstallRequiredPointIds() == null) continue;
                if (other.getInstallRequiredPointIds().contains(pointId)) reversed.add(entry.getKey());
            }
            return reversed;
        }
        return spec != null && spec.getInstallRequiredPointIds() != null
                ? spec.getInstallRequiredPointIds()
                : java.util.Collections.emptyList();
    }

    /** Effective safety conditions for removal — per-point override falls back to install. */
    public java.util.List<String> effectiveRemovalSafetyConditions(Long pointId) {
        PointPrerequisite spec = getPointPrerequisites().get(pointId);
        if (spec == null) return java.util.Collections.emptyList();
        return spec.effectiveRemovalSafetyConditions();
    }

    // ── needsRehang ───────────────────────────────────────────────────────────

    public java.util.Set<Long> getPointNeedsRehang() {
        if (pointNeedsRehangJson == null || pointNeedsRehangJson.isEmpty()) return new java.util.HashSet<>();
        try {
            return objectMapper.readValue(pointNeedsRehangJson,
                    new com.fasterxml.jackson.core.type.TypeReference<java.util.Set<Long>>() {});
        } catch (Exception e) {
            return new java.util.HashSet<>();
        }
    }

    public void setPointNeedsRehang(java.util.Set<Long> ids) {
        try {
            this.pointNeedsRehangJson = objectMapper.writeValueAsString(ids != null ? ids : new java.util.HashSet<>());
        } catch (Exception e) {
            this.pointNeedsRehangJson = "[]";
        }
    }

    public void flagNeedsRehang(Long pointId) {
        java.util.Set<Long> s = getPointNeedsRehang();
        s.add(pointId);
        setPointNeedsRehang(s);
    }

    public void clearNeedsRehang(Long pointId) {
        java.util.Set<Long> s = getPointNeedsRehang();
        s.remove(pointId);
        setPointNeedsRehang(s);
    }

    public boolean isNeedsRehang(Long pointId) {
        return getPointNeedsRehang().contains(pointId);
    }

    public java.util.Map<Long, PointPrerequisite> getPointPrerequisites() {
        if (pointPrerequisitesJson == null || pointPrerequisitesJson.isEmpty()) return new java.util.HashMap<>();
        try {
            return objectMapper.readValue(pointPrerequisitesJson,
                    new com.fasterxml.jackson.core.type.TypeReference<java.util.Map<Long, PointPrerequisite>>() {});
        } catch (Exception e) {
            return new java.util.HashMap<>();
        }
    }

    public void setPointPrerequisites(java.util.Map<Long, PointPrerequisite> prerequisites) {
        try {
            this.pointPrerequisitesJson = objectMapper.writeValueAsString(prerequisites);
        } catch (Exception e) {
            this.pointPrerequisitesJson = "{}";
        }
    }
}