package com.dk_power.power_plant_java.sevice.loto;

import com.dk_power.power_plant_java.dto.permits.LotoDto;
import com.dk_power.power_plant_java.entities.loto.Loto;
import com.dk_power.power_plant_java.mappers.UniversalPermitMapper;
import com.dk_power.power_plant_java.repository.loto.LotoRepo;
import com.dk_power.power_plant_java.sevice.base_services.PermitService;

public interface LotoService extends PermitService<Loto,LotoDto, LotoRepo, UniversalPermitMapper> {

}
