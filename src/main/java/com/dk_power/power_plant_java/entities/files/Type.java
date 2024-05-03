package com.dk_power.power_plant_java.entities.files;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@NoArgsConstructor
@Builder
@Data
@Entity
public class Type {
    //private String group, category, type;
    private String section; // group,                 category,                      type
    private String name;//   file,area,         pid,manual,map, equip             valve,pump
    @Id
    @GeneratedValue
    private Long id;
}
