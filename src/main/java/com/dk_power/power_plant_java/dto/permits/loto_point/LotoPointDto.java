package com.dk_power.power_plant_java.dto.permits.loto_point;

import com.dk_power.power_plant_java.dto.base_dtos.BaseDto;
import com.dk_power.power_plant_java.dto.categories.ValueDto;
import com.dk_power.power_plant_java.dto.equipment.EquipmentDto;
import com.dk_power.power_plant_java.dto.permits.LotoDto;
import com.dk_power.power_plant_java.dto.permits.zero_energy.ZeroEnergyDto;
import com.fasterxml.jackson.annotation.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;
import java.util.Set;

@NoArgsConstructor
@Getter
@Setter
@JsonIgnoreProperties(ignoreUnknown = true)
@JsonInclude(JsonInclude.Include.NON_NULL)
@JsonIdentityInfo(generator = ObjectIdGenerators.PropertyGenerator.class, property = "id")

public class LotoPointDto extends BaseDto {
    private String unit;
    private String tagged;
    private String tagNumber;
    private String description;
    private ValueDto isoPos;
    private ValueDto normPos;
    private String specificLocation;
    private String standard;
    private String generalLocation;
    private List<Long> equipmentIdList;
//    private String equipment;
//    private String extraInfo;
//    private String type;
    private String system;
    private String normalPosition;
    private String isolatedPosition;
//    private String fluid;
//    private String size;
//    private String electricalCheckStatus;
//    private String redTagId;
//    private Boolean inUse = false;
//    @JsonBackReference
    private List<LotoDto> lotos;
    private Set<EquipmentDto> equipmentList;
    private String equipmentIds;
    private String oldId;
    private String objectType;
    private Long isUpdated;
    private String fileIds ;
    private String conflictStatus;
    private String zeroEnergyMethod;
    private ZeroEnergyDto zeroEnergy;
    private Set<Long> relatedLotoPointIds;
    private ValueDto location;
    private ValueDto eqType;

}
