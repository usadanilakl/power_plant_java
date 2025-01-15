package com.dk_power.power_plant_java.dto.data_service_project_dtos.equipment;

import com.dk_power.power_plant_java.dto.categories.ValueDto;
import com.dk_power.power_plant_java.dto.data_service_project_dtos.categories.DS_ValueDto;
import com.dk_power.power_plant_java.dto.equipment.EquipmentDto;
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
public class DS_LotoPointDto extends DS_EquipmentDto {

    public DS_LotoPointDto() {super();}
    private String unit;
    private String tagged;
    private String description;
    private Boolean isUpdated;
    private Boolean isProcessed;
    private DS_ValueDto isolationType;
    private DS_ValueDto normalPosition;
    private DS_ValueDto isolatedPosition;
    private Set<EquipmentDto> isolatedEquipment = new HashSet<>();
}