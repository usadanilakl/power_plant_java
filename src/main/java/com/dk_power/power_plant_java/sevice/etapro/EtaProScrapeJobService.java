package com.dk_power.power_plant_java.sevice.etapro;

import com.dk_power.power_plant_java.dto.etapro.EtaProScrapeJobDto;
import com.dk_power.power_plant_java.entities.etapro.EtaProScrapeJob;
import com.dk_power.power_plant_java.mappers.etapro.EtaProMapper;
import com.dk_power.power_plant_java.repository.etapro.EtaProScrapeJobRepo;
import com.dk_power.power_plant_java.sevice.base_services.CrudService;

/**
 * Thin CrudService interface for {@link EtaProScrapeJob}, required by the sync
 * infrastructure ({@link com.dk_power.power_plant_java.sevice.ServiceFacade}).
 *
 * <p>Business logic stays in {@link EtaProHistoryJobService} — this interface
 * only exists so the CRDT field-sync system can apply incoming job changes.
 */
public interface EtaProScrapeJobService extends CrudService<EtaProScrapeJob, EtaProScrapeJobDto, EtaProScrapeJobRepo, EtaProMapper> {
}
