package com.dk_power.power_plant_java.dto.browser;

import com.dk_power.power_plant_java.entities.categories.Value;
import com.dk_power.power_plant_java.entities.equipment.Equipment;
import com.dk_power.power_plant_java.entities.loto.Loto;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.ManyToOne;
import lombok.Data;

import java.util.HashSet;
import java.util.Set;

@Data
public class BrLotoPoint {
    private Long id;
    private String tagNumber;
    private String description;
    private String specificLocation;
    private String normalPosition;
    private String isolatedPosition;
    private Set<Long> equipmentList;
}
