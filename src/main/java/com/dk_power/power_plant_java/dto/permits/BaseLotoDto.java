package com.dk_power.power_plant_java.dto.permits;

import com.dk_power.power_plant_java.entities.permits.lotos.BaseLoto;
import com.dk_power.power_plant_java.enums.PermitType;

public class BaseLotoDto extends BasePermitDto{
    {
        this.setType(PermitType.LOTO);
    }
}
