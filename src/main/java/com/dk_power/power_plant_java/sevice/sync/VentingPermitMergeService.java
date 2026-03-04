package com.dk_power.power_plant_java.sevice.sync;

import com.dk_power.power_plant_java.entities.permits.VentingPermit;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class VentingPermitMergeService extends SharePointMergeTemplate<VentingPermit> {

    public VentingPermitMergeService(SyncContext syncContext) {
        super(syncContext);
    }

    @Override protected String tableName() { return "venting_permit"; }
    @Override protected String entityName() { return "VentingPermit"; }
    @Override protected Class<VentingPermit> entityClass() { return VentingPermit.class; }
    @Override protected String naturalKeyColumn() { return "sharepoint_id"; }
    @Override protected String jpaFieldName() { return "sharepointId"; }
    @Override protected String logPrefix() { return "[VentingPermit Merge]"; }

    @Override
    protected void markDeleted(VentingPermit entity) {
        entity.setDeleted(true);
    }
}
