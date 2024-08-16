package com.dk_power.power_plant_java.sevice.data_transfer.excel;

import com.dk_power.power_plant_java.dto.data_transfer.HrsgValveDto;
import com.dk_power.power_plant_java.entities.data_transfer.HrsgValve;
import com.dk_power.power_plant_java.mappers.UniversalMapper;
import com.dk_power.power_plant_java.repository.data_transfer.HrsgValveRepo;
import com.dk_power.power_plant_java.sevice.base_services.CrudService;

public interface HrsgValveService extends ExcelTransferService<HrsgValve, HrsgValveDto, HrsgValveRepo, UniversalMapper>{

}