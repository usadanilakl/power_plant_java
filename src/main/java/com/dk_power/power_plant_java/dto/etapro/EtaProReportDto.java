package com.dk_power.power_plant_java.dto.etapro;

import com.dk_power.power_plant_java.dto.base_dtos.BaseDto;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class EtaProReportDto extends BaseDto {
    private String description;
    private String category;
    private int definitionVersion;
    private String definitionJson;
    private String defaultParamsJson;
    private String outputConfigJson;
}
