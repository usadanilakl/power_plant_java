package com.dk_power.power_plant_java.repository.instrumentation;

import com.dk_power.power_plant_java.entities.instrumentation.InstrumentLog;
import com.dk_power.power_plant_java.repository.base_repositories.BaseRepository;

import java.util.List;
import java.util.Optional;

public interface InstrumentLogRepo extends BaseRepository<InstrumentLog> {
    Optional<InstrumentLog> findFirstByLocalUuidOrderByIdAsc(String localUuid);
    Optional<InstrumentLog> findFirstBySharepointIdOrderByIdAsc(String sharepointId);
    List<InstrumentLog> findAllByInstrumentTagNumber(String tagNumber);
    boolean existsBySharepointId(String sharepointId);
}
