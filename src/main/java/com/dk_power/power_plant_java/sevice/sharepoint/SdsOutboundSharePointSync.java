package com.dk_power.power_plant_java.sevice.sharepoint;

import com.dk_power.power_plant_java.dto.pa.PaAttachmentDto;
import com.dk_power.power_plant_java.dto.sds.SdsChemicalDto;
import com.dk_power.power_plant_java.entities.permits.PermitAttachment;
import com.dk_power.power_plant_java.entities.sds.SdsChemical;
import com.dk_power.power_plant_java.mappers.sds.SdsChemicalMapper;
import com.dk_power.power_plant_java.repository.permits.PermitAttachmentRepo;
import com.dk_power.power_plant_java.repository.sds.SdsChemicalRepo;
import com.dk_power.power_plant_java.sevice.sharepoint.adapters.SdsChemicalSharePointAdapter;
import com.dk_power.power_plant_java.sevice.sharepoint.syncables.SdsChemicalSharePointSyncable;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/**
 * Hub-only outbound SharePoint push for SDS chemicals.
 * <p>
 * SDS records are created/edited on the hub/desktop (intake wizard, PDF dump, edits, status changes,
 * deletes) rather than the PWA, and desktop changes reach the hub as field-level sync — they never
 * pass back through {@code NgSdsChemicalService}, so nothing pushes them to SharePoint. This hub sweep
 * closes that gap in three passes every minute:
 * <ol>
 *   <li><b>Create</b> — chemicals with no {@code sharepointId} are created in the "SDS" list (with attachments).</li>
 *   <li><b>Update</b> — chemicals already on SP whose local values differ from the last-seen SP snapshot
 *       are pushed (covers edits and status changes like "Mark Removed"). Loop-free: it reuses the same
 *       per-item snapshot the inbound pull maintains, so once pushed the next pull sees no change.</li>
 *   <li><b>Delete</b> — soft-deleted ({@code deleted=true}) chemicals that still have a SP row get their
 *       SP item hard-deleted, then their {@code sharepointId} is cleared so the delete isn't retried.</li>
 * </ol>
 * Everything runs via the certificate (primary) with a Power Automate fallback.
 */
@Slf4j
@Component
@ConditionalOnProperty(name = "sync.role", havingValue = "hub")
@RequiredArgsConstructor
public class SdsOutboundSharePointSync {

    private static final int MAX_PER_RUN = 25;

    private final SdsChemicalRepo repo;
    private final SdsChemicalMapper mapper;
    private final SdsChemicalSharePointAdapter adapter;
    private final SdsChemicalSharePointSyncable syncable;
    private final SharePointFieldMergeService fieldMergeService;
    private final PermitAttachmentRepo attachmentRepo;

    @Scheduled(initialDelay = 30_000, fixedDelay = 60_000)
    public void sweep() {
        pushCreates();
        pushUpdates();
        pushDeletes();
    }

    // ── Pass 1: create new records on SP ──────────────────────────────────────
    private void pushCreates() {
        List<SdsChemical> pending;
        try {
            pending = repo.findUnsyncedWithStatus();
        } catch (Exception e) {
            log.warn("[SDS Outbound] Could not load unsynced chemicals: {}", e.getMessage());
            return;
        }
        if (pending == null || pending.isEmpty()) return;

        int pushed = 0;
        for (SdsChemical entity : pending) {
            if (pushed >= MAX_PER_RUN) break;
            try {
                if (pushOne(entity)) pushed++;
            } catch (Exception e) {
                log.warn("[SDS Outbound] Create failed for id={}: {}", entity.getId(), e.getMessage());
            }
        }
        if (pushed > 0) log.info("[SDS Outbound] Created {} SDS chemical(s) in SharePoint", pushed);
    }

    private boolean pushOne(SdsChemical entity) {
        if (entity.getSharepointId() != null) return false;
        if (entity.getLocalUuid() == null || entity.getLocalUuid().isBlank()) {
            entity.setLocalUuid(UUID.randomUUID().toString());
        }

        SdsChemicalDto dto = mapper.convertToDto(entity);
        String spId = adapter.create(dto);   // cert primary → PA fallback
        if (spId == null) return false;

        entity.setSharepointId(spId);
        repo.save(entity);

        // Seed the snapshot so the update pass doesn't immediately re-push this record.
        dto.setSharepointId(spId);
        fieldMergeService.updateSnapshot(syncable.getEntityTypeName(), spId, syncable.extractSpFieldValues(dto));

        // Push attachments (the SDS PDF) so the SharePoint backup is complete.
        List<PermitAttachment> atts = attachmentRepo.findByEntityTypeAndEntityId(SdsChemicalMapper.ENTITY_TYPE, entity.getId());
        for (PermitAttachment att : atts) {
            try {
                PaAttachmentDto pa = new PaAttachmentDto();
                pa.setFileName(att.getFileName());
                pa.setContentType(att.getContentType());
                pa.setBase64Content(att.getBase64Content());
                adapter.addAttachment(spId, pa);
            } catch (Exception e) {
                log.warn("[SDS Outbound] Attachment push failed for spId={}: {}", spId, e.getMessage());
            }
        }
        return true;
    }

    // ── Pass 2: push local edits/status changes for records already on SP ──────
    private void pushUpdates() {
        List<SdsChemical> synced;
        try {
            synced = repo.findSyncedWithStatus();
        } catch (Exception e) {
            log.warn("[SDS Outbound] Could not load synced chemicals: {}", e.getMessage());
            return;
        }
        if (synced == null || synced.isEmpty()) return;

        String entityType = syncable.getEntityTypeName();
        int pushed = 0;
        for (SdsChemical entity : synced) {
            if (pushed >= MAX_PER_RUN) break;
            String spId = entity.getSharepointId();
            try {
                SdsChemicalDto dto = mapper.convertToDto(entity);
                Map<String, String> localValues = syncable.extractSpFieldValues(dto);
                // Fields where the LOCAL value differs from what SP last had (snapshot).
                Set<String> changed = fieldMergeService.getSpChangedFields(entityType, spId, localValues);
                if (changed.isEmpty()) continue;

                adapter.update(spId, dto);
                fieldMergeService.updateSnapshot(entityType, spId, localValues);
                pushed++;
            } catch (Exception e) {
                log.warn("[SDS Outbound] Update failed for spId={}: {}", spId, e.getMessage());
            }
        }
        if (pushed > 0) log.info("[SDS Outbound] Updated {} SDS chemical(s) in SharePoint", pushed);
    }

    // ── Pass 3: hard-delete SP rows for soft-deleted chemicals ────────────────
    private void pushDeletes() {
        List<SdsChemical> deleted;
        try {
            deleted = repo.findDeletedWithSharepointId();
        } catch (Exception e) {
            log.warn("[SDS Outbound] Could not load deleted chemicals: {}", e.getMessage());
            return;
        }
        if (deleted == null || deleted.isEmpty()) return;

        int removed = 0;
        for (SdsChemical entity : deleted) {
            if (removed >= MAX_PER_RUN) break;
            String spId = entity.getSharepointId();
            try {
                adapter.delete(spId);
                repo.clearSharepointId(entity.getId()); // stop retrying this one
                removed++;
            } catch (Exception e) {
                log.warn("[SDS Outbound] Delete failed for spId={}: {}", spId, e.getMessage());
            }
        }
        if (removed > 0) log.info("[SDS Outbound] Deleted {} SDS chemical(s) from SharePoint", removed);
    }
}
