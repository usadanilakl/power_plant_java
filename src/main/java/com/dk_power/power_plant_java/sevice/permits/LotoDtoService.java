package com.dk_power.power_plant_java.sevice.permits;

import com.dk_power.power_plant_java.dto.permits.LotoDto;
import com.dk_power.power_plant_java.entities.permits.Loto;

public interface LotoDtoService {
    LotoDto toDto(Loto loto);
    Loto toEntity(LotoDto loto);
}
