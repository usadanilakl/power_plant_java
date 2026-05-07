package com.dk_power.power_plant_java.dto.permits;

import com.dk_power.power_plant_java.dto.base_dtos.BaseDto;
import com.dk_power.power_plant_java.dto.permits.loto_point.LotoPointIdDto;
import com.dk_power.power_plant_java.enums.Status;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@EqualsAndHashCode(callSuper = true)
@Data
public class LotoSnapshotDto extends BaseDto {
    private Long lotoId;
    private String boxNumber;
    private String locks;
    private String requestorName;
    private String workAuthority;
    private LocalDateTime requestTime;
    private LocalDateTime workAuthorityTime;
    private Status status;
    private Set<LotoPointIdDto> lotoPointsData = new HashSet<>();
    private String workScope;
    private String snapshotReason;

    // Lifecycle event fields
    private String hungBy;                       private LocalDateTime hungAt;
    private String verifiedBy;                   private LocalDateTime verifiedAt;
    private String activatedBy;                  private LocalDateTime activatedAt;
    private String testStartedBy;                private LocalDateTime testStartedAt;
    private String reactivatedBy;                private LocalDateTime reactivatedAt;
    private String transferredFrom;              private String transferredTo;          private LocalDateTime transferredAt;
    private String acceptedBy;                   private LocalDateTime acceptedAt;
    private String requestorReleasedBy;          private LocalDateTime requestorReleasedAt;
    private String controlAuthorityReleasedBy;   private LocalDateTime controlAuthorityReleasedAt;
    private String locksRemovedBy;               private LocalDateTime locksRemovedAt;
    private String closedBy;                     private LocalDateTime closedAt;
}
