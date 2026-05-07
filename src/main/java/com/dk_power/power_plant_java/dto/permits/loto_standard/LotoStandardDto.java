package com.dk_power.power_plant_java.dto.permits.loto_standard;

import com.dk_power.power_plant_java.dto.base_dtos.BaseDto;
import com.dk_power.power_plant_java.dto.categories.ValueDto;
import com.dk_power.power_plant_java.dto.permits.loto_point.LotoPointDto;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

@Getter
@Setter
public class LotoStandardDto extends BaseDto {
    private Long id;
    private String name;
    private String description;
    private List<LotoPointDto> lotoPoints;
    private String lotoPointOrder;
    private java.util.Map<Long, com.dk_power.power_plant_java.entities.loto.PointPrerequisite> pointPrerequisites;
    private Set<ValueDto> groups;

    // Procedural prose
    private String prerequisitesText;
    private String hazardControlMethodsText;
    private String installProcedureText;
    private String removalProcedureText;

    // Development workflow
    private ValueDto developmentStatus;
    private Integer currentVersion;
    private String submittedForVerificationBy;
    private LocalDateTime submittedForVerificationAt;
    private String verifiedBy;
    private LocalDateTime verifiedAt;
    private String walkdownBy;
    private LocalDateTime walkdownAt;
    private String readyForTestingBy;
    private LocalDateTime readyForTestingAt;
    private String managerApprovedBy;
    private LocalDateTime managerApprovedAt;
}
