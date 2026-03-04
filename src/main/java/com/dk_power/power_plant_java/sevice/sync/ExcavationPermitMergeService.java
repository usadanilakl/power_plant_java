package com.dk_power.power_plant_java.sevice.sync;

import com.dk_power.power_plant_java.entities.permits.ExcavationPermit;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class ExcavationPermitMergeService extends SharePointMergeTemplate<ExcavationPermit> {

    public ExcavationPermitMergeService(SyncContext syncContext) {
        super(syncContext);
    }

    @Override protected String tableName() { return "excavation_permit"; }
    @Override protected String entityName() { return "ExcavationPermit"; }
    @Override protected Class<ExcavationPermit> entityClass() { return ExcavationPermit.class; }
    @Override protected String naturalKeyColumn() { return "sharepoint_id"; }
    @Override protected String jpaFieldName() { return "sharepointId"; }
    @Override protected String logPrefix() { return "[ExcavationPermit Merge]"; }

    @Override
    protected void markDeleted(ExcavationPermit entity) {
        entity.setDeleted(true);
    }
}
