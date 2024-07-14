package com.dk_power.power_plant_java.sevice.equipment;

import com.dk_power.power_plant_java.dto.equipment.LotoPointDto;
import com.dk_power.power_plant_java.entities.loto.LotoPoint;
import com.dk_power.power_plant_java.mappers.UniversalMapper;
import com.dk_power.power_plant_java.repository.loto.LotoPointRepo;
import com.dk_power.power_plant_java.sevice.data_transfer.excel.ExcelTransferService;


public interface LotoPointService extends ExcelTransferService<LotoPoint, LotoPointDto, LotoPointRepo, UniversalMapper> {

}
