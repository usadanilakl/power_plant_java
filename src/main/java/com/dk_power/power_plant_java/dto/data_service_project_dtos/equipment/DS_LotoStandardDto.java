package com.dk_power.power_plant_java.dto.data_service_project_dtos.equipment;

import com.dk_power.power_plant_java.dto.equipment.EquipmentDto;
import com.dk_power.power_plant_java.dto.permits.LotoPointDto;
import com.fasterxml.jackson.annotation.JsonIdentityInfo;
import com.fasterxml.jackson.annotation.ObjectIdGenerators;
import lombok.Getter;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

import java.util.HashSet;
import java.util.Set;

@Getter
@Setter
@SuperBuilder

@JsonIdentityInfo(
        generator = ObjectIdGenerators.PropertyGenerator.class,
        property = "id"
)
public class DS_LotoStandardDto extends DS_EquipmentDto {

    public DS_LotoStandardDto() {super();}

    private String name;
    private Set<DS_LotoPointDto> lotoPoints = new HashSet<>();
}