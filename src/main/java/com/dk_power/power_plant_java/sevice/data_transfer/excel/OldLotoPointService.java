package com.dk_power.power_plant_java.sevice.data_transfer.excel;

import com.dk_power.power_plant_java.dto.data_transfer.OldLotoPointDto;
import com.dk_power.power_plant_java.entities.data_transfer.OldLotoPoint;
import com.dk_power.power_plant_java.mappers.UniversalMapper;
import com.dk_power.power_plant_java.repository.data_transfer.OldLotoPointRepo;
import com.dk_power.power_plant_java.sevice.base_services.CrudService;

import java.util.List;

public interface OldLotoPointService
        extends ExcelTransferService
        <OldLotoPoint, OldLotoPointDto, OldLotoPointRepo, UniversalMapper>
{

}
