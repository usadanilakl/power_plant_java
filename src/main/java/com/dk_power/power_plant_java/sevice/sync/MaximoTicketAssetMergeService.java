package com.dk_power.power_plant_java.sevice.sync;

import com.dk_power.power_plant_java.entities.maximo.MaximoTicketAsset;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * Sync-time dedup for {@link MaximoTicketAsset} (natural key: ticketKey). Hub-only. Pure search-index leaf —
 * both duplicate rows were built from the same underlying Maximo ticket, so content is equivalent and a plain
 * smallest-id survivor (the template default) is correct. No child re-point (nothing FK-references it); a
 * dropped row is fully re-derivable by the next incremental ticket-index scan.
 */
@Service
@Slf4j
public class MaximoTicketAssetMergeService extends SharePointMergeTemplate<MaximoTicketAsset> {

    public MaximoTicketAssetMergeService(SyncContext syncContext) { super(syncContext); }

    @Override protected String tableName() { return "maximo_ticket_asset"; }
    @Override protected String entityName() { return "MaximoTicketAsset"; }
    @Override protected Class<MaximoTicketAsset> entityClass() { return MaximoTicketAsset.class; }
    @Override protected String naturalKeyColumn() { return "ticket_key"; }
    @Override protected String jpaFieldName() { return "ticketKey"; }
    @Override protected String logPrefix() { return "[MaximoTicketAsset Merge]"; }
    @Override protected void markDeleted(MaximoTicketAsset entity) { entity.setDeleted(true); }
}
