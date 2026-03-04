package com.dk_power.power_plant_java.sevice.sync;

import com.dk_power.power_plant_java.entities.permits.EnergizedWorkPermit;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class EnergizedWorkPermitMergeService extends SharePointMergeTemplate<EnergizedWorkPermit> {

    public EnergizedWorkPermitMergeService(SyncContext syncContext) {
        super(syncContext);
    }

    @Override protected String tableName() { return "energized_work_permit"; }
    @Override protected String entityName() { return "EnergizedWorkPermit"; }
    @Override protected Class<EnergizedWorkPermit> entityClass() { return EnergizedWorkPermit.class; }
    @Override protected String naturalKeyColumn() { return "sharepoint_id"; }
    @Override protected String jpaFieldName() { return "sharepointId"; }
    @Override protected String logPrefix() { return "[EnergizedWorkPermit Merge]"; }

    @Override
    protected void markDeleted(EnergizedWorkPermit entity) {
        entity.setDeleted(true);
    }
}
