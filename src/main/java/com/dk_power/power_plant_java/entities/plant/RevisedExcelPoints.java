package com.dk_power.power_plant_java.entities.plant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@NoArgsConstructor
@Getter
@Setter
public class RevisedExcelPoints {
    @Id
    @GeneratedValue
    Long id;
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
    @Column(nullable = true)
    Boolean inUse = false;
}
