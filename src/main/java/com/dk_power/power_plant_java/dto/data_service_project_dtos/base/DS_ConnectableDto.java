package com.dk_power.power_plant_java.dto.data_service_project_dtos.base;

import com.dk_power.power_plant_java.dto.base_dtos.BaseDto;
import lombok.Getter;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

@Getter
@Setter
@SuperBuilder
//@JsonIgnoreProperties(ignoreUnknown = true)
//@JsonInclude(JsonInclude.Include.NON_NULL)
public class DS_ConnectableDto extends DS_BaseDto {
    protected DS_ConnectableDto(){super();}
}