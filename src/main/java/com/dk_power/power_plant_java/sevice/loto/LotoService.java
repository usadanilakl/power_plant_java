package com.dk_power.power_plant_java.sevice.loto;

import com.dk_power.power_plant_java.dto.permits.LotoDto;
import com.dk_power.power_plant_java.entities.loto.Loto;
import com.dk_power.power_plant_java.enums.Status;
import com.dk_power.power_plant_java.mappers.UniversalMapper;
import com.dk_power.power_plant_java.repository.loto.LotoRepo;
import com.dk_power.power_plant_java.sevice.base_services.PermitService;

import java.util.List;

public interface LotoService extends PermitService<Loto,LotoDto, LotoRepo, UniversalMapper> {

}
