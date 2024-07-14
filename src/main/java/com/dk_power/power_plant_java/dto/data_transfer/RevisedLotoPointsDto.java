package com.dk_power.power_plant_java.dto.data_transfer;

import com.dk_power.power_plant_java.dto.BaseDto;
import com.dk_power.power_plant_java.entities.base_entities.BaseIdEntity;
import jakarta.persistence.Entity;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;


@Getter
@Setter
@NoArgsConstructor
public class RevisedLotoPointsDto extends BaseDto {
    private String unit;
    private String tagged;
    private String label;
    private String description;
    private String location;
    private String standard;
    private String generalLocation;
    private String equipment;
    private String extraInfo;
    private String type;
    private String system;
    private String pAndID;
    private String normalPos;
    private String isoPos;
    private String fluid;
    private String size;
    private String recId;
    private String num;
    private String temperature;
    private String num2;
    private String otherPid;
    private String originalId;
    private String equip;
}
