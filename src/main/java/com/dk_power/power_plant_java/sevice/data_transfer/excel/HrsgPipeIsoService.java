package com.dk_power.power_plant_java.sevice.data_transfer.excel;

import com.dk_power.power_plant_java.dto.data_transfer.HrsgPipeIsoDto;
import com.dk_power.power_plant_java.entities.data_transfer.HrsgPipeIso;
import com.dk_power.power_plant_java.mappers.UniversalMapper;
import com.dk_power.power_plant_java.repository.data_transfer.HrsgPipeIsoRepo;
import com.dk_power.power_plant_java.sevice.base_services.CrudService;

public interface HrsgPipeIsoService extends ExcelTransferService<HrsgPipeIso, HrsgPipeIsoDto, HrsgPipeIsoRepo, UniversalMapper> {

}