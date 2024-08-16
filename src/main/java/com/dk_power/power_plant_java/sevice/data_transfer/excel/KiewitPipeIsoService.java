package com.dk_power.power_plant_java.sevice.data_transfer.excel;

import com.dk_power.power_plant_java.dto.data_transfer.KiewitPipeIsoDto;
import com.dk_power.power_plant_java.entities.data_transfer.KiewitPipeIso;
import com.dk_power.power_plant_java.mappers.UniversalMapper;
import com.dk_power.power_plant_java.repository.data_transfer.KiewitPipeIsoRepo;
import com.dk_power.power_plant_java.sevice.base_services.CrudService;

public interface KiewitPipeIsoService extends ExcelTransferService<KiewitPipeIso, KiewitPipeIsoDto, KiewitPipeIsoRepo, UniversalMapper> {

}