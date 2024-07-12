package com.dk_power.power_plant_java.repository.data_transfer;

import com.dk_power.power_plant_java.dto.data_transfer.RevisedLotoPointsDto;
import com.dk_power.power_plant_java.entities.data_transfer.RevisedLotoPoints;
import com.dk_power.power_plant_java.mappers.UniversalMapper;
import com.dk_power.power_plant_java.repository.base_repositories.BaseRepository;
import com.dk_power.power_plant_java.sevice.base_services.CrudService;

public interface RevisedPointRepo extends BaseRepository<RevisedLotoPoints> {
}
