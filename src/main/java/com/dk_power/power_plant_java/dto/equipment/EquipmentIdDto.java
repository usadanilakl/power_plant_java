package com.dk_power.power_plant_java.dto.equipment;

import com.dk_power.power_plant_java.dto.base_dtos.BaseEquipmentDto;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;
import java.util.Set;

@Getter
@Setter
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class EquipmentIdDto extends BaseEquipmentDto {
    private String tagNumber;
    private String description;
    private String specificLocation;
    private Long eqTypeId;
    private List<String> files;
    private Long vendorId;
    private Long locationId;
    private Long systemId;
    private String coordinates;
    private String originalPictureSize;
    private String mainFile;
    private Long mainFileId;
    private Set<Long> lotoPointIds;
    private List<Long> heatTraceIds;
    private Long highlightId;
    private String isUpdated;
    private String conflictStatus;
    private Boolean isVerified = false;
}