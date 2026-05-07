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
}