package com.dk_power.power_plant_java.dto.permits;

import com.dk_power.power_plant_java.dto.base_dtos.BaseDto;
import com.dk_power.power_plant_java.dto.categories.ValueDto;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class NgWorkRequestDto extends BaseDto {


    private String dateOfWorkToBePerformed;

    private String timeOfWorkToBePerformed;

    private String requestedBy;

    private String company;

    private String location;

    private String affectedEquipment;

    private String workScope;

    private Boolean isHotWorkRequired;
    private String foreman;
    private String fireWatch;

    private Boolean isLotoRequired;

    private Boolean isConfinedSpaceEntryRequired;
    private String space;
    private String sharepointId;
    private String status;
    private Boolean hasJha;
    private Integer attachmentCount;
    private WorkAreaDto workArea;
    private ValueDto workCategory;
    private Long dailyPermitPackageId;
}
