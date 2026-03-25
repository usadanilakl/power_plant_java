package com.dk_power.power_plant_java.dto.sim_equipment;

import com.dk_power.power_plant_java.dto.base_dtos.BaseDto;
import com.fasterxml.jackson.annotation.JsonIdentityInfo;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.ObjectIdGenerators;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@JsonIgnoreProperties(ignoreUnknown = true)
@JsonIdentityInfo(generator = ObjectIdGenerators.PropertyGenerator.class, property = "id")
@NoArgsConstructor
public class SimEquipmentDto extends BaseDto {
    private String description;
    private String symbolId;
    private String svgPath;
    private Integer defaultWidth;
    private Integer defaultHeight;
    private String defaultColor;
    private String simRole;
    private String simParamsJson;
    private String sourceEntityType;
    private Long sourceEntityId;
}
