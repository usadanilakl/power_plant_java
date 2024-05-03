package com.dk_power.power_plant_java.sevice.permits;

import com.dk_power.power_plant_java.entities.permits.Loto;

import java.util.List;

public interface LotoService {
    List<Loto> getAllLotos();
    Loto getLotoById(Long id);

}
