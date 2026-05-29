package com.dk_power.power_plant_java.sevice.sharepoint;

import com.dk_power.power_plant_java.dto.sds.SdsAuditRecordDto;
import com.dk_power.power_plant_java.entities.sds.SdsAuditRecord;
import com.dk_power.power_plant_java.mappers.sds.SdsAuditRecordMapper;
import com.dk_power.power_plant_java.repository.sds.SdsAuditRecordRepo;
import com.dk_power.power_plant_java.sevice.sharepoint.adapters.SdsAuditRecordSharePointAdapter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.UUID;

/**
 * Hub-only outbound SharePoint push for SDS audit records (created on the hub/desktop, or synced in
 * from clients). Mirrors {@link SdsOutboundSharePointSync} — pushes records lacking a sharepointId to
 * the "SDS Audit" list via the certificate. The PWA pushes its own audit records via PA when offline;
 * this catches anything created hub-side or synced in without a SP id.
 */
@Slf4j
@Component
@ConditionalOnProperty(name = "sync.role", havingValue = "hub")
@RequiredArgsConstructor
public class SdsAuditOutboundSharePointSync {

    private static final int MAX_PER_RUN = 50;

    private final SdsAuditRecordRepo repo;
    private final SdsAuditRecordMapper mapper;
    private final SdsAuditRecordSharePointAdapter adapter;

    @Scheduled(initialDelay = 40_000, fixedDelay = 60_000)
    public void pushUnsynced() {
        List<SdsAuditRecord> pending;
        try {
            pending = repo.findBySharepointIdIsNull();
        } catch (Exception e) {
            log.warn("[SDS Audit Outbound] Could not load unsynced records: {}", e.getMessage());
            return;
        }
        if (pending == null || pending.isEmpty()) return;

        int pushed = 0;
        for (SdsAuditRecord entity : pending) {
            if (pushed >= MAX_PER_RUN) break;
            try {
                if (entity.getLocalUuid() == null || entity.getLocalUuid().isBlank()) {
                    entity.setLocalUuid(UUID.randomUUID().toString());
                }
                SdsAuditRecordDto dto = mapper.convertToDto(entity);
                String spId = adapter.create(dto);
                if (spId != null) {
                    entity.setSharepointId(spId);
                    repo.save(entity);
                    pushed++;
                }
            } catch (Exception e) {
                log.warn("[SDS Audit Outbound] Push failed for id={}: {}", entity.getId(), e.getMessage());
            }
        }
        if (pushed > 0) log.info("[SDS Audit Outbound] Pushed {} audit record(s) to SharePoint", pushed);
    }
}
