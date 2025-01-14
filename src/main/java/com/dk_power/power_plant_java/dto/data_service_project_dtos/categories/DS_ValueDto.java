package com.dk_power.power_plant_java.dto.data_service_project_dtos.categories;

import com.dk_power.power_plant_java.dto.categories.CategoryDto;
import com.dk_power.power_plant_java.dto.data_service_project_dtos.base.DS_BaseDto;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
public class DS_ValueDto extends DS_BaseDto {
    private String name;
    private String description;
    private CategoryDto category;
}
