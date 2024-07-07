package com.dk_power.power_plant_java.dto.equipment;

import com.dk_power.power_plant_java.entities.permits.lotos.TempLoto;
import com.dk_power.power_plant_java.entities2.BaseEntity;
import com.dk_power.power_plant_java.entities2.loto.Loto;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.envers.Audited;

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
    private List<TempLoto> lotos;
    private List<Loto> permLotos;

}
