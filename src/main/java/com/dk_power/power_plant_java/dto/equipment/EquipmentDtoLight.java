package com.dk_power.power_plant_java.dto.equipment;



import com.dk_power.power_plant_java.dto.categories.ValueDto;
import com.dk_power.power_plant_java.dto.permits.LotoPointDto;
import com.fasterxml.jackson.annotation.JsonBackReference;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;
import java.util.Set;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class EquipmentDtoLight {
    private Long id;
    private String tagNumber;
    private String description;
    private String specificLocation;
    private String eqType;
    private String vendor;
    private String location;
    private String system;
}
