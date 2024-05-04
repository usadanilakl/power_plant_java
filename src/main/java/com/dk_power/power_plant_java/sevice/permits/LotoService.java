package com.dk_power.power_plant_java.sevice.permits;

import com.dk_power.power_plant_java.dto.permits.LotoDto;
import com.dk_power.power_plant_java.entities.permits.Loto;
import com.dk_power.power_plant_java.entities.permits.LotoTemp;
import com.dk_power.power_plant_java.enums.Status;

import java.util.List;
import java.util.Optional;

public interface LotoService {
    List<Loto> getAllLotos();
    Loto getLotoById(Long id);
    Loto saveLoto(Loto loto);
    Loto createNewLoto(LotoDto loto);
    Loto changeStatus(Long id, Status status);


}
