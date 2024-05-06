package com.dk_power.power_plant_java.sevice.permits;

import com.dk_power.power_plant_java.dto.permits.LotoDto;
import com.dk_power.power_plant_java.dto.permits.SwDto;
import com.dk_power.power_plant_java.entities.permits.Loto;
import com.dk_power.power_plant_java.entities.permits.Sw;

public interface SwDtoService {
    SwDto toDto(Sw sw);
    Sw toEntity(SwDto sw);
}
