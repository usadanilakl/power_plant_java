package com.dk_power.power_plant_java.sevice.sync;

import com.dk_power.power_plant_java.entities.permits.Jha;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * Dedup merge service for JHA entities.
 * Extends the generic SharePointMergeTemplate.
 * JHA is a leaf entity with no owned FKs, so transferRelationships() is a no-op (default).
 */
@Service
@Slf4j
public class JhaMergeService extends SharePointMergeTemplate<Jha> {

    public JhaMergeService(SyncContext syncContext) {
        super(syncContext);
    }

    @Override protected String tableName() { return "jha"; }
    @Override protected String entityName() { return "Jha"; }
    @Override protected Class<Jha> entityClass() { return Jha.class; }
    @Override protected String naturalKeyColumn() { return "sharepoint_id"; }
    @Override protected String jpaFieldName() { return "sharepointId"; }
    @Override protected String logPrefix() { return "[JHA Merge]"; }

    @Override
    protected void markDeleted(Jha entity) {
        entity.setDeleted(true);
    }
}
