package com.dk_power.power_plant_java.repository.equipment;

import com.dk_power.power_plant_java.entities.categories.Value;
import com.dk_power.power_plant_java.entities.equipment.Equipment;
import com.dk_power.power_plant_java.entities.equipment.Highlight;
import com.dk_power.power_plant_java.repository.base_repositories.BaseRepository;

import java.util.List;

public interface HighlightRepo extends BaseRepository<Highlight> {
    Highlight findByCoordinates(String coord);
}
