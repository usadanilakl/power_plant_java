package com.dk_power.power_plant_java.entities.data_transfer;

import com.dk_power.power_plant_java.entities.base_entities.BaseIdEntity;
import jakarta.persistence.Entity;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@NoArgsConstructor
public class RevisedLotoPoints extends BaseIdEntity {
    private String unit;
    private String Tag;
    private String tagged;
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
