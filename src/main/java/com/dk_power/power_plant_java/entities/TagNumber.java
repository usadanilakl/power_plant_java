package com.dk_power.power_plant_java.entities;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
public class TagNumber {
    @Id
    @GeneratedValue
    private Long id;
    private String system;
    private Integer unit;
    private String equipmentType;
    private Integer number;

    public String generateTagNumber() {
        return unit + "-" + equipmentType + "-" + system + "-" + number + "-JG";
    }
}
