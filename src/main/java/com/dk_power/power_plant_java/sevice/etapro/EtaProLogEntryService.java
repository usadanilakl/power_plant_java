package com.dk_power.power_plant_java.sevice.etapro;

import com.dk_power.power_plant_java.dto.etapro.EtaProLogEntryDto;
import com.dk_power.power_plant_java.entities.etapro.EtaProLogEntry;
import com.dk_power.power_plant_java.mappers.etapro.EtaProMapper;
import com.dk_power.power_plant_java.repository.etapro.EtaProLogEntryRepo;
import com.dk_power.power_plant_java.sevice.base_services.CrudService;
import org.springframework.data.domain.Page;

import java.time.LocalDateTime;

public interface EtaProLogEntryService
        extends CrudService<EtaProLogEntry, EtaProLogEntryDto, EtaProLogEntryRepo, EtaProMapper> {

    Page<EtaProLogEntry> getRecentPaginated(int page, int pageSize);

    Page<EtaProLogEntry> getByTimeRangePaginated(LocalDateTime start, LocalDateTime end, int page, int pageSize);
}
