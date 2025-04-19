package com.dk_power.power_plant_java.dto.permits;

import com.dk_power.power_plant_java.dto.base_dtos.BasePermitDto;
import com.dk_power.power_plant_java.entities.loto.LotoPoint;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class LotoDto extends BasePermitDto {

    private List<LotoPoint> lotoPoints;
    private List<LockDto> locks;
    private BoxDto box;


}
