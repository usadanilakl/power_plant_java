package com.dk_power.power_plant_java.sevice.sync;

import com.dk_power.power_plant_java.entities.permits.SafeWork;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class SafeWorkMergeService extends SharePointMergeTemplate<SafeWork> {

    public SafeWorkMergeService(SyncContext syncContext) {
        super(syncContext);
    }

    @Override protected String tableName() { return "safe_work"; }
    @Override protected String entityName() { return "SafeWork"; }
    @Override protected Class<SafeWork> entityClass() { return SafeWork.class; }
    @Override protected String naturalKeyColumn() { return "sharepoint_id"; }
    @Override protected String jpaFieldName() { return "sharepointId"; }
    @Override protected String logPrefix() { return "[SafeWork Merge]"; }

    @Override
    protected void markDeleted(SafeWork entity) {
        entity.setDeleted(true);
    }
}
