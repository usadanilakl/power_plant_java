package com.dk_power.power_plant_java.repository.equipment;

import com.dk_power.power_plant_java.entities.equipment.HtPanel;
import com.dk_power.power_plant_java.repository.base_repositories.BaseRepository;

public interface HtPanelRepo extends BaseRepository<HtPanel> {
    HtPanel findByTagNumber(String panel);

}
