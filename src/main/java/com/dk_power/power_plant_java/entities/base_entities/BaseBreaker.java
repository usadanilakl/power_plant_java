package com.dk_power.power_plant_java.entities.base_entities;

import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.MappedSuperclass;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@MappedSuperclass
@Setter
@Getter
@NoArgsConstructor
public class BaseBreaker extends BaseIdEntity{

    private BaseElectricalPanel panel;
    private String tagNumber;
    private BaseEquipment equipment;
}
