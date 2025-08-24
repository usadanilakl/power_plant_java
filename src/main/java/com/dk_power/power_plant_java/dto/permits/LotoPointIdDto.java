package com.dk_power.power_plant_java.dto.permits;

import com.dk_power.power_plant_java.dto.base_dtos.BaseDto;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;
import java.util.Set;

@NoArgsConstructor
@Getter
@Setter
public class LotoPointIdDto extends BaseDto {
    private String unit;
    private String tagged;
    private String tagNumber;
    private String description;
    private Long isoPos;
    private Long normPos;
    private String specificLocation;
    private String standard;
    private String generalLocation;
    private List<Long> equipmentIdList;
    private String normalPosition;
    private String isolatedPosition;
    private List<Long> lotos;
    private Set<Long> equipmentList;
    private String oldId;
    private String objectType;
    private Long isUpdated;
    private String fileIds ;
    private String conflictStatus;
    private String zeroEnergyMethod;
}
