package com.dk_power.power_plant_java.sevice.sync;

import com.dk_power.power_plant_java.entities.instrumentation.Instrument;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * Dedup merge service for Instrument entities by SharePoint ID.
 */
@Service
@Slf4j
public class InstrumentMergeService extends SharePointMergeTemplate<Instrument> {

    public InstrumentMergeService(SyncContext syncContext) {
        super(syncContext);
    }

    @Override protected String tableName() { return "instrument"; }
    @Override protected String entityName() { return "Instrument"; }
    @Override protected Class<Instrument> entityClass() { return Instrument.class; }
    @Override protected String naturalKeyColumn() { return "sharepoint_id"; }
    @Override protected String jpaFieldName() { return "sharepointId"; }
    @Override protected String logPrefix() { return "[Instrument Merge]"; }

    @Override
    protected void markDeleted(Instrument entity) {
        entity.setDeleted(true);
    }
}

