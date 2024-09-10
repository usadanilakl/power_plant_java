package com.dk_power.power_plant_java.repository.highlights;

import com.dk_power.power_plant_java.entities.highlights.Highlight;
import com.dk_power.power_plant_java.repository.base_repositories.BaseRepository;

public interface HighlightRepo extends BaseRepository<Highlight> {
    Highlight findByCoordinates(String coord);
}
