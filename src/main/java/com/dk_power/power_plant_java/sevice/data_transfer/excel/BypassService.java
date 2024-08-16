package com.dk_power.power_plant_java.sevice.data_transfer.excel;

import com.dk_power.power_plant_java.dto.data_transfer.BypassDto;
import com.dk_power.power_plant_java.entities.data_transfer.Bypass;
import com.dk_power.power_plant_java.mappers.UniversalMapper;
import com.dk_power.power_plant_java.repository.data_transfer.BypassRepo;
import com.dk_power.power_plant_java.sevice.base_services.CrudService;

public interface BypassService extends ExcelTransferService<Bypass, BypassDto, BypassRepo, UniversalMapper> {
}
