package com.dk_power.power_plant_java.dto.permits;

import com.dk_power.power_plant_java.entities.loto.Box;
import com.dk_power.power_plant_java.enums.PermitType;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
public class BaseLotoDto extends BasePermitDto{
    {
        this.setType(PermitType.LOTO);
    }
    private Box box;
}
