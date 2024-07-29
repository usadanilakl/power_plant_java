package com.dk_power.power_plant_java.repository.equipment;

import com.dk_power.power_plant_java.entities.equipment.ElectricalPanel;
import com.dk_power.power_plant_java.entities.equipment.HtPanel;
import com.dk_power.power_plant_java.repository.base_repositories.BaseRepository;

import java.awt.*;

public interface ElectricalPanelRepo extends BaseRepository<ElectricalPanel> {
    ElectricalPanel findByTagNumber(String panel);

}
