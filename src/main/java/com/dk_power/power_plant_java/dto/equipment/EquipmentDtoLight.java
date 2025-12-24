package com.dk_power.power_plant_java.dto.equipment;



import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

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
