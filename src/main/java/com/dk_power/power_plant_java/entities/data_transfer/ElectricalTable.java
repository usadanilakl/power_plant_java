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
public class ElectricalTable extends BaseIdEntity {
    private String tagNumber;
    private String breakerLocation;
    private String category;
    private String bus;
    private String breakerType;
    private String powerUser;
    private String oldId;
}
