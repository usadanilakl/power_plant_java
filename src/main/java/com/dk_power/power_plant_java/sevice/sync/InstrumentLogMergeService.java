package com.dk_power.power_plant_java.sevice.sync;

import com.dk_power.power_plant_java.entities.instrumentation.InstrumentLog;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Dedup merge service for InstrumentLog entities by SharePoint ID.
 */
@Service
@Slf4j
public class InstrumentLogMergeService extends SharePointMergeTemplate<InstrumentLog> {

    public InstrumentLogMergeService(SyncContext syncContext) {
        super(syncContext);
    }

    @Override protected String tableName() { return "instrument_log"; }
    @Override protected String entityName() { return "InstrumentLog"; }
    @Override protected Class<InstrumentLog> entityClass() { return InstrumentLog.class; }
    @Override protected String naturalKeyColumn() { return "sharepoint_id"; }
    @Override protected String jpaFieldName() { return "sharepointId"; }
    @Override protected String logPrefix() { return "[InstrumentLog Merge]"; }

    @Override
    protected void markDeleted(InstrumentLog entity) {
        entity.setDeleted(true);
    }

    /**
     * Dedup on BOTH sharepoint_id and local_uuid: they identify genuinely different duplicate populations —
     * sharepoint_id collisions come from the SP-import path, local_uuid collisions from CRDT/offline-retry
     * submissions (which may still have a null sharepoint_id). A single key would silently miss one class.
     */
    @Override
    protected List<NaturalKeySpec> naturalKeys() {
        return List.of(
                new NaturalKeySpec("sharepoint_id", "sharepointId"),
                new NaturalKeySpec("local_uuid", "localUuid"));
    }

    @Override
    protected void transferRelationships(Long duplicateId, Long canonicalId, String naturalKeyValue) {
        int updated = entityManager.createNativeQuery(
                "UPDATE permit_attachment SET entity_id = :canId " +
                "WHERE entity_type = 'InstrumentLog' AND entity_id = :dupId")
            .setParameter("canId", canonicalId)
            .setParameter("dupId", duplicateId)
            .executeUpdate();

        if (updated > 0) {
            log.info("[InstrumentLog Merge] Transferred {} attachment(s) from ID={} to ID={}",
                updated, duplicateId, canonicalId);
        }
    }
}

