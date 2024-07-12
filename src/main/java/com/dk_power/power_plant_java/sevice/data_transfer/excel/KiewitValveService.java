package com.dk_power.power_plant_java.sevice.data_transfer.excel;

import com.dk_power.power_plant_java.dto.data_transfer.KiewitValveDto;
import com.dk_power.power_plant_java.entities.data_transfer.KiewitValve;
import com.dk_power.power_plant_java.mappers.UniversalMapper;
import com.dk_power.power_plant_java.repository.data_transfer.KiewitValveRepo;
import com.dk_power.power_plant_java.sevice.base_services.CrudService;

public interface KiewitValveService extends ExcelTransferService<KiewitValve, KiewitValveDto, KiewitValveRepo, UniversalMapper> {

}