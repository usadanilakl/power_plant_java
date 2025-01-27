package com.dk_power.power_plant_java.dto.data_service_project_dtos.equipment;

import com.dk_power.power_plant_java.dto.base_dtos.BaseDto;
import com.dk_power.power_plant_java.dto.categories.ValueDto;
import com.dk_power.power_plant_java.dto.data_service_project_dtos.base.DS_BaseDto;
import com.dk_power.power_plant_java.dto.equipment.EquipmentDto;
import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIdentityInfo;
import com.fasterxml.jackson.annotation.ObjectIdGenerators;
import lombok.Getter;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

@Getter
@Setter
@SuperBuilder
@JsonIdentityInfo(
        generator = ObjectIdGenerators.PropertyGenerator.class,
        property = "id"
)
public class DS_TagNumberDto extends DS_BaseDto {
    public DS_TagNumberDto() { super(); }
    private String number;
    private ValueDto system;
    @JsonBackReference
    private EquipmentDto equipment;
    private boolean isAssigned;
    private boolean isPrimary;
}
