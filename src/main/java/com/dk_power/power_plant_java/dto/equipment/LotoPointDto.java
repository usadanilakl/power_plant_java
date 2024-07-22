package com.dk_power.power_plant_java.dto.equipment;

import com.dk_power.power_plant_java.dto.categories.ValueDto;
import com.dk_power.power_plant_java.dto.permits.LotoDto;
import com.dk_power.power_plant_java.entities.base_entities.BaseAuditEntity;
import com.dk_power.power_plant_java.entities.loto.Loto;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;
import java.util.Set;

@NoArgsConstructor
@Getter
@Setter
public class LotoPointDto extends BaseAuditEntity {
    private String unit;
    private String tagged;
    private String tagNumber;
    private String description;
    private ValueDto isoPos;
    private ValueDto normPos;
//    private String location;
    private String standard;
//    private String generalLocation;
//    private String equipment;
//    private String extraInfo;
//    private String type;
//    private String system;
    private String normalPosition;
    private String isolatedPosition;
//    private String fluid;
//    private String size;
//    private String electricalCheckStatus;
//    private String redTagId;
//    private Boolean inUse = false;
    private List<LotoDto> lotos;
    private Set<EquipmentDto> equipmentList;
    private String oldId;
    private String objectType;

}
