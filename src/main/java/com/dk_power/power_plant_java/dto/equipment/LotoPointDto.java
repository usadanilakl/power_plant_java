package com.dk_power.power_plant_java.dto.equipment;

import com.dk_power.power_plant_java.entities.base_entities.BaseEntity;
import com.dk_power.power_plant_java.entities.loto.Loto;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@NoArgsConstructor
@Getter
@Setter
public class LotoPointDto extends BaseEntity {
    String unit;
    String tagged;
    String label;
    String description;
    String location;
    String standard;
    String generalLocation;
    String equipment;
    String extraInfo;
    String type;
    String system;
    String normalPosition;
    String isolatedPosition;
    String fluid;
    String size;
    String electricalCheckStatus;
    String redTagId;
    Boolean inUse = false;
    private List<Loto> permLotos;

}
