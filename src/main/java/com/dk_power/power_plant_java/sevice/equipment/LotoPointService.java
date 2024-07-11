package com.dk_power.power_plant_java.sevice.equipment;

import com.dk_power.power_plant_java.dto.equipment.LotoPointDto;
import com.dk_power.power_plant_java.entities.equipment.LotoPoint;
import com.dk_power.power_plant_java.mappers.UniversalMapper;
import com.dk_power.power_plant_java.repository.loto.LotoPointRepo;
import com.dk_power.power_plant_java.sevice.base_services.CrudService;

import java.util.List;


public interface LotoPointService extends CrudService<LotoPoint, LotoPointDto, LotoPointRepo, UniversalMapper> {
    List<LotoPoint> transferExcelToDb();
}
