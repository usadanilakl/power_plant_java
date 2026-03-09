package com.dk_power.power_plant_java.repository.instrumentation;

import com.dk_power.power_plant_java.entities.instrumentation.Instrument;
import com.dk_power.power_plant_java.repository.base_repositories.BaseRepository;

import java.util.List;
import java.util.Optional;

public interface InstrumentRepo extends BaseRepository<Instrument> {
    Optional<Instrument> findByTagNumber(String tagNumber);
    Optional<Instrument> findFirstBySharepointIdOrderByIdAsc(String sharepointId);
    Optional<Instrument> findFirstByLocalUuidOrderByIdAsc(String localUuid);
    Optional<Instrument> findTopByOrderByDateModifiedDesc();
    boolean existsBySharepointId(String sharepointId);
    List<Instrument> findAllByCurrentStatus(String status);
}
