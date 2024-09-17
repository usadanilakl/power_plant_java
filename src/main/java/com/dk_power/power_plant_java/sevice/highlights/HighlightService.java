package com.dk_power.power_plant_java.sevice.highlights;

import com.dk_power.power_plant_java.dto.equipment.HighlightDto;
import com.dk_power.power_plant_java.entities.equipment.Equipment;
import com.dk_power.power_plant_java.entities.highlights.Highlight;
import com.dk_power.power_plant_java.mappers.equipment.HighlightMapper;
import com.dk_power.power_plant_java.repository.highlights.HighlightRepo;
import com.dk_power.power_plant_java.sevice.base_services.CrudService;

public interface HighlightService extends CrudService<Highlight, HighlightDto, HighlightRepo, HighlightMapper>{
    void transferEqToHighlights(Equipment eq);
    void transferConnectorToHighlights(Equipment eq);
    Equipment combineDuplicatesAndCreateHighlights(String tagNumber);
    void fixConnectorsBeforeTranser();
    void fixCoordinates();
    void performTransfer();
}
