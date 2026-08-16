package com.dk_power.power_plant_java.repository.instrumentation;

import com.dk_power.power_plant_java.entities.instrumentation.Instrument;
import com.dk_power.power_plant_java.repository.base_repositories.BaseRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface InstrumentRepo extends BaseRepository<Instrument> {
    Optional<Instrument> findByTagNumber(String tagNumber);
    Optional<Instrument> findFirstBySharepointIdOrderByIdAsc(String sharepointId);
    Optional<Instrument> findFirstByLocalUuidOrderByIdAsc(String localUuid);
    Optional<Instrument> findTopByOrderByDateModifiedDesc();

    /** Rows that never reached SharePoint — the outbound catch-up job's work list. */
    List<Instrument> findBySharepointIdIsNull();

    /**
     * Rows touched at or after a cursor, for the PWA's incremental register sync.
     *
     * Inclusive (>=) on purpose: the cursor the client holds is a previous max {@code dateModified},
     * and anything written inside that same instant would fall through a strict {@code >}. Re-sending
     * the boundary rows is harmless — the client upserts by tag.
     */
    List<Instrument> findByDateModifiedGreaterThanEqualOrderByDateModifiedAsc(LocalDateTime since);
    boolean existsBySharepointId(String sharepointId);
    List<Instrument> findAllByCurrentStatus(String status);
}
