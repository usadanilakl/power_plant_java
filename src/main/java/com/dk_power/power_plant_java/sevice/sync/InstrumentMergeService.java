package com.dk_power.power_plant_java.sevice.sync;

import com.dk_power.power_plant_java.entities.instrumentation.Instrument;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * Dedup merge service for Instrument entities. Keyed on tagNumber (NOT sharepoint_id): tagNumber is the real
 * identity (always populated from the SP "Tag Number" column and on local creates), a sharepoint_id dup is
 * always also a tagNumber dup, and the deterministic-coexist path in FieldSyncService needs the merge grouped
 * on the SAME key it dedups on. (The DB unique(tag_number) constraint is dropped by
 * {@code InstrumentTagUniqueConstraintFixer} so a duplicate can coexist long enough for this to merge it,
 * exactly like Category/Value.)
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
    @Override protected String naturalKeyColumn() { return "tag_number"; }
    @Override protected String jpaFieldName() { return "tagNumber"; }
    @Override protected String logPrefix() { return "[Instrument Merge]"; }

    @Override
    protected void markDeleted(Instrument entity) {
        entity.setDeleted(true);
    }
}

