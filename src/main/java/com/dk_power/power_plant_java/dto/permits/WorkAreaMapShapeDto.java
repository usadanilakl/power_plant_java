package com.dk_power.power_plant_java.dto.permits;

import com.dk_power.power_plant_java.dto.base_dtos.BaseDto;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
public class WorkAreaMapShapeDto extends BaseDto {
    private String coordinates;
    private String originalPictureSize;
    private String label;
    private List<Long> workAreaIds;
}
