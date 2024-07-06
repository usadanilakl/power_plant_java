package com.dk_power.power_plant_java.dto.permits;

import com.dk_power.power_plant_java.entities.plant.RevisedExcelPoints;
import com.dk_power.power_plant_java.enums.PermitType;
import com.fasterxml.jackson.annotation.JsonBackReference;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;
@Getter
@Setter
@NoArgsConstructor
public class TempLotoDto extends BasePermitDto{
    {
        this.setType(PermitType.LOTO);
    }
//    @JsonBackReference
    private List<RevisedExcelPoints> lotoPoints;
}
