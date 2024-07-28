package com.dk_power.power_plant_java.sevice.equipment;

import com.dk_power.power_plant_java.dto.equipment.HtPanelDto;
import com.dk_power.power_plant_java.entities.equipment.HtPanel;
import com.dk_power.power_plant_java.mappers.HtPanelMapper;
import com.dk_power.power_plant_java.repository.equipment.HtPanelRepo;
import com.dk_power.power_plant_java.sevice.base_services.CrudService;

public interface HtPanelService extends CrudService<HtPanel, HtPanelDto, HtPanelRepo, HtPanelMapper> {
}
