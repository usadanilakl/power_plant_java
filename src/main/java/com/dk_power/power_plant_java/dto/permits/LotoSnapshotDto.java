package com.dk_power.power_plant_java.dto.permits;

import com.dk_power.power_plant_java.dto.base_dtos.BaseDto;
import com.dk_power.power_plant_java.enums.Status;
import jakarta.persistence.Column;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
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
}
