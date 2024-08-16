package com.dk_power.power_plant_java.entities.base_entities;

import com.dk_power.power_plant_java.entities.base_entities.BaseIdEntity;
import jakarta.persistence.Entity;
import jakarta.persistence.MappedSuperclass;
import jakarta.persistence.OneToMany;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;

@MappedSuperclass
@Getter
@Setter
@NoArgsConstructor
public class BaseElectricalPanel extends BaseIdEntity {
    private String location;
    private String tagNumber;



}
