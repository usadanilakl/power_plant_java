package com.dk_power.power_plant_java.sevice.sync;

import com.dk_power.power_plant_java.entities.permits.HotWork;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class HotWorkMergeService extends SharePointMergeTemplate<HotWork> {

    public HotWorkMergeService(SyncContext syncContext) {
        super(syncContext);
    }

    @Override protected String tableName() { return "hot_work"; }
    @Override protected String entityName() { return "HotWork"; }
    @Override protected Class<HotWork> entityClass() { return HotWork.class; }
    @Override protected String naturalKeyColumn() { return "sharepoint_id"; }
    @Override protected String jpaFieldName() { return "sharepointId"; }
    @Override protected String logPrefix() { return "[HotWork Merge]"; }

    @Override
    protected void markDeleted(HotWork entity) {
        entity.setDeleted(true);
    }
}
