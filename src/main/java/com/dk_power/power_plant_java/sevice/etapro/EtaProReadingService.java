package com.dk_power.power_plant_java.sevice.etapro;

import com.dk_power.power_plant_java.dto.etapro.EtaProReadingDto;
import com.dk_power.power_plant_java.entities.etapro.EtaProReading;
import com.dk_power.power_plant_java.mappers.etapro.EtaProMapper;
import com.dk_power.power_plant_java.repository.etapro.EtaProReadingRepo;
import com.dk_power.power_plant_java.sevice.base_services.CrudService;
import org.springframework.data.domain.Page;

import java.time.LocalDateTime;
import java.util.List;

public interface EtaProReadingService extends CrudService<EtaProReading, EtaProReadingDto, EtaProReadingRepo, EtaProMapper> {
    List<EtaProReading> getByPointAndTimeRange(String pointId, LocalDateTime start, LocalDateTime end);
    Page<EtaProReading> getByPointPaginated(String pointId, int page, int pageSize);
    Page<EtaProReading> getByTimeRangePaginated(LocalDateTime start, LocalDateTime end, int page, int pageSize);
    List<EtaProReading> getLatestPerPoint();
    List<EtaProReading> getBySessionId(String sessionId);
}
