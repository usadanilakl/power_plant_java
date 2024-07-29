package com.dk_power.power_plant_java.sevice.equipment;

import com.dk_power.power_plant_java.dto.equipment.ElectricalPanelDto;
import com.dk_power.power_plant_java.entities.equipment.ElectricalPanel;
import com.dk_power.power_plant_java.entities.equipment.HtPanel;
import com.dk_power.power_plant_java.mappers.equipment.ElectricalPanelMapper;
import com.dk_power.power_plant_java.repository.equipment.ElectricalPanelRepo;
import com.dk_power.power_plant_java.sevice.base_services.CrudService;

import java.awt.*;

public interface ElectricalPanelService extends CrudService<ElectricalPanel, ElectricalPanelDto, ElectricalPanelRepo, ElectricalPanelMapper> {
    ElectricalPanel getByTagNumber(String panel);
}
