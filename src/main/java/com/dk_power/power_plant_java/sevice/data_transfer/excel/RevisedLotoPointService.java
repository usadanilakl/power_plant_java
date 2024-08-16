package com.dk_power.power_plant_java.sevice.data_transfer.excel;

import com.dk_power.power_plant_java.dto.data_transfer.RevisedLotoPointsDto;
import com.dk_power.power_plant_java.entities.data_transfer.RevisedLotoPoints;
import com.dk_power.power_plant_java.mappers.UniversalMapper;
import com.dk_power.power_plant_java.repository.data_transfer.RevisedPointRepo;
import com.dk_power.power_plant_java.sevice.base_services.CrudService;

public interface RevisedLotoPointService extends ExcelTransferService<RevisedLotoPoints, RevisedLotoPointsDto, RevisedPointRepo, UniversalMapper> {
}
