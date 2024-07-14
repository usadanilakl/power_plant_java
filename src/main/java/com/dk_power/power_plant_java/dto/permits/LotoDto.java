package com.dk_power.power_plant_java.dto.permits;

import com.dk_power.power_plant_java.entities.loto.LotoPoint;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class LotoDto extends BaseLotoDto{

    private List<LotoPoint> lotoPoints;
}
