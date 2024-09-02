package com.dk_power.power_plant_java.sevice.loto.loto_point;

import com.dk_power.power_plant_java.dto.permits.LotoPointDto;
import com.dk_power.power_plant_java.entities.loto.LotoPoint;
import com.dk_power.power_plant_java.mappers.LotoPointMapper;
import com.dk_power.power_plant_java.repository.loto.LotoPointRepo;
import com.dk_power.power_plant_java.sevice.base_services.CrudService;
import com.dk_power.power_plant_java.sevice.base_services.RefactorService;
import com.dk_power.power_plant_java.sevice.data_transfer.excel.ExcelTransferService;

public interface LotoPointMergeService extends CrudService<LotoPoint, LotoPointDto, LotoPointRepo, LotoPointMapper> {
    LotoPoint copyPointFromOtherUnit(Long id);
}
