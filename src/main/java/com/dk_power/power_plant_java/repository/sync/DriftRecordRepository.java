package com.dk_power.power_plant_java.repository.sync;

import com.dk_power.power_plant_java.entities.sync.DriftPeer;
import com.dk_power.power_plant_java.entities.sync.DriftRecord;
import com.dk_power.power_plant_java.entities.sync.DriftStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

/**
 * Durable per-machine drift records. Detection upserts by the unique (entityType, entityId, fieldName, peer)
 * key; the UI queries by type + active status for badges, and by (type,id) to drill into a row.
 */
public interface DriftRecordRepository extends JpaRepository<DriftRecord, Long> {

    /** The upsert lookup key. */
    Optional<DriftRecord> findByEntityTypeAndEntityIdAndFieldNameAndPeer(
            String entityType, Long entityId, String fieldName, DriftPeer peer);

    /** All records (any status/field/peer) for one row — the form/row drill-down. */
    List<DriftRecord> findByEntityTypeAndEntityId(String entityType, Long entityId);

    /** Active row-level records for a type + peer — feeds the table badge map + detection's reconcile sweep. */
    List<DriftRecord> findByEntityTypeAndPeerAndFieldNameAndStatusIn(
            String entityType, DriftPeer peer, String fieldName, Collection<DriftStatus> statuses);

    /** Active records for a type (any field/peer) — general query. */
    List<DriftRecord> findByEntityTypeAndStatusIn(String entityType, Collection<DriftStatus> statuses);

    List<DriftRecord> findByStatusIn(Collection<DriftStatus> statuses);

    long countByStatus(DriftStatus status);

    long countByEntityTypeAndStatusIn(String entityType, Collection<DriftStatus> statuses);
}
