package com.dk_power.power_plant_java.repository.data_transfer;

import com.dk_power.power_plant_java.entities.data_transfer.ElectricalTable;
import com.dk_power.power_plant_java.entities.data_transfer.RevisedLotoPoints;
import com.dk_power.power_plant_java.repository.base_repositories.BaseRepository;

import java.util.List;

public interface ElectricalTableRepo extends BaseRepository<ElectricalTable> {
    List<ElectricalTable> findByTagNumber(String tagNumber);
    List<ElectricalTable> findByOldId(String oldId);
}
