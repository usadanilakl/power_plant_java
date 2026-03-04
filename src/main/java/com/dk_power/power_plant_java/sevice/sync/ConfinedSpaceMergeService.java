package com.dk_power.power_plant_java.sevice.sync;

import com.dk_power.power_plant_java.entities.permits.ConfinedSpace;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class ConfinedSpaceMergeService extends SharePointMergeTemplate<ConfinedSpace> {

    public ConfinedSpaceMergeService(SyncContext syncContext) {
        super(syncContext);
    }

    @Override protected String tableName() { return "confined_space"; }
    @Override protected String entityName() { return "ConfinedSpace"; }
    @Override protected Class<ConfinedSpace> entityClass() { return ConfinedSpace.class; }
    @Override protected String naturalKeyColumn() { return "sharepoint_id"; }
    @Override protected String jpaFieldName() { return "sharepointId"; }
    @Override protected String logPrefix() { return "[ConfinedSpace Merge]"; }

    @Override
    protected void markDeleted(ConfinedSpace entity) {
        entity.setDeleted(true);
    }
}
