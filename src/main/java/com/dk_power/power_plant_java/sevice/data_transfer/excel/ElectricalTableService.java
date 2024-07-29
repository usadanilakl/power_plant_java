package com.dk_power.power_plant_java.sevice.data_transfer.excel;

import com.dk_power.power_plant_java.dto.data_transfer.ElectricalTableDto;
import com.dk_power.power_plant_java.dto.data_transfer.HrsgPipeIsoDto;
import com.dk_power.power_plant_java.entities.data_transfer.ElectricalTable;
import com.dk_power.power_plant_java.entities.data_transfer.HrsgPipeIso;
import com.dk_power.power_plant_java.mappers.UniversalMapper;
import com.dk_power.power_plant_java.repository.data_transfer.ElectricalTableRepo;
import com.dk_power.power_plant_java.repository.data_transfer.HrsgPipeIsoRepo;

public interface ElectricalTableService extends ExcelTransferService<ElectricalTable, ElectricalTableDto, ElectricalTableRepo, UniversalMapper> {

}