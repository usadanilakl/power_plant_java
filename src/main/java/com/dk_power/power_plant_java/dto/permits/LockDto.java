package com.dk_power.power_plant_java.dto.permits;

import com.dk_power.power_plant_java.entities.loto.Loto;
import com.dk_power.power_plant_java.enums.Status;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@AllArgsConstructor
@NoArgsConstructor
@Setter
@Getter
public class LockDto {
    private Integer number = 0;
    private Loto loto;
    private Status status;
    private Long id;

}
