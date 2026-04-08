package com.dk_power.power_plant_java.sevice.etapro;

import com.dk_power.power_plant_java.dto.etapro.EtaProPointDto;
import com.dk_power.power_plant_java.entities.etapro.EtaProPoint;
import com.dk_power.power_plant_java.mappers.etapro.EtaProMapper;
import com.dk_power.power_plant_java.repository.etapro.EtaProPointRepo;
import com.dk_power.power_plant_java.sevice.base_services.CrudService;

import java.util.List;

public interface EtaProPointService extends CrudService<EtaProPoint, EtaProPointDto, EtaProPointRepo, EtaProMapper> {
    List<EtaProPoint> getActivePoints();
    EtaProPoint getByPointId(String pointId);
    List<EtaProPoint> getByCategory(String category);
}
