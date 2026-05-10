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
        Set<LotoPointIdDto> dtos = new HashSet<>();

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
     * Clears all event-recording fields. Called after a snapshot is duplicated for a new
     * status transition so events stay tied to the snapshot row that recorded them rather
     * than getting copied forward.
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
        pointHungByJson = null;
        pointHungAtJson = null;
        pointHangNotesJson = null;
        pointVerifiedByJson = null;
        pointVerifiedAtJson = null;
        pointVerifyNotesJson = null;
        pointWalkdownByJson = null;
        pointWalkdownAtJson = null;
        pointWalkdownNotesJson = null;
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