package com.dk_power.power_plant_java.dto.permits;

import com.dk_power.power_plant_java.entities.permits.lotos.Loto;
import com.dk_power.power_plant_java.entities.plant.RevisedExcelPoints;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.ManyToMany;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class LotoDto extends BaseLotoDto{

    private List<RevisedExcelPoints> lotoPoints;
}
