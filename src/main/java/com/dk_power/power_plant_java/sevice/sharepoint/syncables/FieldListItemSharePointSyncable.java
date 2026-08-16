package com.dk_power.power_plant_java.sevice.sharepoint.syncables;

import com.dk_power.power_plant_java.dto.field_list.FieldListItemDto;
import com.dk_power.power_plant_java.dto.sharepoint.SyncResult;
import com.dk_power.power_plant_java.entities.field_list.FieldListItem;
import com.dk_power.power_plant_java.mappers.field_list.FieldListItemMapper;
import com.dk_power.power_plant_java.repository.field_list.FieldListItemRepo;
import com.dk_power.power_plant_java.sevice.angular.NgValueService;
import com.dk_power.power_plant_java.sevice.maximo.MaximoFieldListEvents;
import com.dk_power.power_plant_java.sevice.sharepoint.SharePointFieldMergeService;
import com.dk_power.power_plant_java.sevice.sharepoint.SharePointSyncable;
import com.dk_power.power_plant_java.sevice.sharepoint.adapters.FieldListItemSharePointAdapter;
import com.dk_power.power_plant_java.sevice.sync.PermitAttachmentSyncService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;

@Slf4j
@Component
@RequiredArgsConstructor
public class FieldListItemSharePointSyncable implements SharePointSyncable<FieldListItemDto> {

    private final FieldListItemSharePointAdapter adapter;
    private final FieldListItemRepo repo;
    private final FieldListItemMapper mapper;
    private final NgValueService valueService;
    private final SharePointFieldMergeService fieldMergeService;
    private final PermitAttachmentSyncService permitAttachmentSyncService;
    /**
     * Publishes Maximo bridge events for rows arriving via SP-import. Matches the
     * FieldListItemSyncService pattern — SP-import is another non-user-facing write
     * path that would otherwise skip the bridge. Fires Submitted on CREATE (new SP
     * row imported for the first time). Hub-only bridge = no-op on desktops.
     */
    private final ApplicationEventPublisher events;

    private static final String ENTITY_TYPE = "FieldListItem";
    private static final String LIST_TITLE = "Field Lists";

    private static final Map<String, String> FIELD_MAPPING = Map.ofEntries(
        Map.entry("title", "Title"),
        Map.entry("listType", "ListType"),
        Map.entry("status", "Status"),
        Map.entry("location", "Location"),
        Map.entry("specificLocation", "SpecificLocation"),
        Map.entry("notes", "Notes"),
        Map.entry("dateObserved", "DateObserved"),
        Map.entry("equipment", "EquipmentTag"),
        Map.entry("submitterName", "SubmitterName"),
        Map.entry("submitterEmail", "SubmitterEmail"),
        Map.entry("submitterPhone", "SubmitterPhone"),
        Map.entry("localUuid", "PwaId")
    );

    @Override
    public String getEntityTypeName() { return ENTITY_TYPE; }

    @Override
    public String getSharePointListTitle() { return LIST_TITLE; }

    @Override
    public List<FieldListItemDto> fetchAllFromSharePoint() {
        return adapter.getAll();
    }

    @Override
    public List<FieldListItemDto> fetchModifiedSince(Instant since) {
        return adapter.getModifiedSince(since);
    }

    @Override
    public long getSyncIntervalMs() { return 60_000; } // 1 minute

    @Override
    @Transactional
    public EntitySyncOutcome processRemoteItem(FieldListItemDto remote, SyncResult result) {
        if (remote.getSharepointId() == null || remote.getSharepointId().isEmpty()) {
            result.incrementSkipped();
            return EntitySyncOutcome.SKIPPED;
        }

        String spId = remote.getSharepointId();
        Map<String, String> spValues = extractSpFieldValues(remote);
        Instant spModified = getSpModifiedTime(remote);

        // Find existing: by sharepointId first, then by localUuid
        FieldListItem existing = repo.findFirstBySharepointIdOrderByIdAsc(spId).orElse(null);
        if (existing == null && remote.getLocalUuid() != null && !remote.getLocalUuid().isEmpty()) {
            existing = repo.findFirstByLocalUuidOrderByIdAsc(remote.getLocalUuid()).orElse(null);
            if (existing != null) {
                existing.setSharepointId(spId);
                repo.save(existing);
                log.info("[FieldList-Sync] Bound localUuid={} to spId={}", remote.getLocalUuid(), spId);
            }
        }

        if (existing == null) {
            FieldListItem entity = mapper.convertToEntity(remote);
            entity.setSharepointId(spId);
            entity.setSpModifiedTime(spModified);
            // Also copy the contractor-close fields from the SP row onto the new entity
            // so a row that was BOTH created AND closed offline (rare but possible) lands
            // with the closed markers set. See maybePublishContractorClose below.
            entity.setContractorCompletedBy(remote.getContractorCompletedBy());
            entity.setContractorCompletedAt(remote.getContractorCompletedAt());
            repo.save(entity);
            result.incrementCreated();
            fieldMergeService.updateSnapshot(ENTITY_TYPE, spId, spValues);
            syncAttachmentsSafely(entity.getId(), spId);
            // Route to Maximo — this is the "PWA→PA→SP→hub-imports→Maximo" recovery path
            // for offline submissions. Only fires on the hub (bridge is hub-only). Bridge
            // is idempotent so we're safe even if the local sync path already published.
            events.publishEvent(new MaximoFieldListEvents.Submitted(entity.getId()));
            // If this row also arrived contractor-completed, fire the close event too. The
            // listener REQUIRES_NEW tx runs after commit; bridge.complete's idempotency
            // guards handle the case where the Submitted's WO-create is still in flight
            // (won't be — same commit boundary; bridge.complete will see the maximoHref).
            maybePublishContractorClose(entity.getId(), remote);
            return EntitySyncOutcome.CREATED;
        }

        Set<String> spChangedColumns = fieldMergeService.getSpChangedFields(ENTITY_TYPE, spId, spValues);
        if (spChangedColumns.isEmpty()) {
            return EntitySyncOutcome.SKIPPED;
        }

        Set<String> fieldsToApply = fieldMergeService.resolveConflicts(
            ENTITY_TYPE, existing.getId(), FIELD_MAPPING, spChangedColumns, spModified);
        if (fieldsToApply.isEmpty()) {
            fieldMergeService.updateSnapshot(ENTITY_TYPE, spId, spValues);
            return EntitySyncOutcome.SKIPPED;
        }

        // Detect the contractor-close transition BEFORE we apply the changes so we can
        // compare pre-state vs post-state. Contractor-close is a rising edge — fire the
        // event only when we transition from "not marked completed by contractor" to
        // "marked completed by contractor". Prior state = whether the local row already
        // has a ContractorCompletedBy attribution (we don't persist a separate boolean;
        // the presence of an attribution is our persisted "was-closed" record).
        boolean wasContractorClosed = existing.getContractorCompletedBy() != null
                && !existing.getContractorCompletedBy().isBlank();

        applySelectiveFields(existing, remote, fieldsToApply);
        // Always copy the contractor-close markers into the local row so drift + UI can
        // see them, regardless of which fields were "selected" for update by the merge
        // service. These are always hub-side derived data (contractor's PWA writes SP,
        // hub imports here — never overwritten by hub).
        existing.setContractorCompletedBy(remote.getContractorCompletedBy());
        existing.setContractorCompletedAt(remote.getContractorCompletedAt());
        existing.setSpModifiedTime(spModified);
        repo.save(existing);
        result.incrementUpdated();
        fieldMergeService.updateSnapshot(ENTITY_TYPE, spId, spValues);
        syncAttachmentsSafely(existing.getId(), spId);
        // Fire the contractor-close event only if the transition is fresh (rising edge).
        // Rising edge is measured against the SP boolean (not the entity's ContractorCompletedBy
        // string) — codex round 3: PA could set true+blankBy briefly, and using the string alone
        // would silently miss it. Extra guard on Maximo-terminal status avoids re-firing forever
        // on a SP row that stays "true + blank By" across multiple poll ticks: entity.By stays
        // null so wasContractorClosed stays false, and without this guard every poll would re-
        // publish ContractorClosed (bridge is idempotent so it's not a bug, just wasteful).
        boolean nowContractorClosed = Boolean.TRUE.equals(remote.getContractorCompleted());
        if (!wasContractorClosed && nowContractorClosed
                && !isMaximoTerminal(existing.getMaximoStatus())) {
            maybePublishContractorClose(existing.getId(), remote);
        }
        // Fire StatusChanged when the SP-side flipped status on a WO-routed row. Listener
        // filters by wo-completion-status; bridge.complete idempotency handles double-fire.
        // Only publishes when status was actually among the applied fields — no spurious
        // publish for pure Notes/Location edits.
        if (fieldsToApply.contains("status")
                && "WO".equals(existing.getMaximoRecordType())
                && existing.getMaximoRecordId() != null
                && existing.getStatus() != null && existing.getStatus().getName() != null
                && !isMaximoTerminal(existing.getMaximoStatus())) {
            events.publishEvent(new MaximoFieldListEvents.StatusChanged(
                    existing.getId(), existing.getStatus().getName(), "sharepoint-import"));
        }
        return EntitySyncOutcome.UPDATED;
    }

    private static boolean isMaximoTerminal(String status) {
        if (status == null) return false;
        return "COMP".equalsIgnoreCase(status)
                || "CLOSE".equalsIgnoreCase(status)
                || "CAN".equalsIgnoreCase(status);
    }

    /**
     * Publish {@link MaximoFieldListEvents.ContractorClosed} when the SP row indicates the
     * contractor closed offline. Rising-edge signal is the {@code ContractorCompleted}
     * boolean (source of truth); {@code ContractorCompletedBy} is best-effort attribution
     * that may lag or be blank. Codex round 3: earlier version gated on the By string being
     * nonblank, which silently dropped a true-with-blank-By event and left the WO open.
     */
    private void maybePublishContractorClose(Long fieldListItemId, FieldListItemDto remote) {
        if (!Boolean.TRUE.equals(remote.getContractorCompleted())) return;
        String actor = remote.getContractorCompletedBy();
        events.publishEvent(new MaximoFieldListEvents.ContractorClosed(fieldListItemId, actor));
    }

    @Override
    public String getSharepointId(FieldListItemDto dto) {
        return dto.getSharepointId();
    }

    @Override
    public boolean supportsAutoClose() { return false; }

    @Override
    public void autoCloseAbsentRecords(Set<String> remoteSharepointIds, SyncResult result) {
        // no-op — field list items don't auto-close
    }

    @Override
    public void mergeIfDuplicatesExist() {
        // no-op — handled by localUuid binding in processRemoteItem
    }

    @Override
    public Map<String, String> getFieldMapping() {
        return FIELD_MAPPING;
    }

    @Override
    public Map<String, String> extractSpFieldValues(FieldListItemDto dto) {
        Map<String, String> values = new LinkedHashMap<>();
        values.put("Title", dto.getTitle());
        values.put("ListType", dto.getListTypeName());
        values.put("Status", dto.getStatusName());
        values.put("Location", dto.getLocationName());
        values.put("SpecificLocation", dto.getSpecificLocation());
        values.put("Notes", dto.getNotes());
        values.put("DateObserved", dto.getDateObserved());
        values.put("EquipmentTag", dto.getEquipmentTag());
        values.put("SubmitterName", dto.getSubmitterName());
        values.put("SubmitterEmail", dto.getSubmitterEmail());
        values.put("SubmitterPhone", dto.getSubmitterPhone());
        values.put("PwaId", dto.getLocalUuid());
        return values;
    }

    @Override
    public Instant getSpModifiedTime(FieldListItemDto dto) {
        return dto.getSpModifiedTime();
    }

    @Override
    public void applySelectiveFields(Object entityObj, FieldListItemDto dto, Set<String> fields) {
        FieldListItem entity = (FieldListItem) entityObj;
        if (fields.contains("title")) entity.setTitle(dto.getTitle());
        if (fields.contains("listType") && dto.getListTypeName() != null) {
            entity.setListType(valueService.createValue("FieldListType", dto.getListTypeName()));
        }
        if (fields.contains("status") && dto.getStatusName() != null) {
            entity.setStatus(valueService.createValue("FieldListStatus", dto.getStatusName()));
        }
        if (fields.contains("location") && dto.getLocationName() != null) {
            entity.setLocation(valueService.createValue("Location", dto.getLocationName()));
        }
        if (fields.contains("specificLocation")) entity.setSpecificLocation(dto.getSpecificLocation());
        if (fields.contains("notes")) entity.setNotes(dto.getNotes());
        if (fields.contains("dateObserved")) {
            entity.setDateObserved(dto.getDateObserved());
            entity.setTimeObserved(dto.getTimeObserved());
        }
        if (fields.contains("equipment")) {
            mapper.resolveEquipmentReference(entity, dto.getEquipmentTag(), null);
        }
        if (fields.contains("submitterName")) entity.setSubmitterName(dto.getSubmitterName());
        if (fields.contains("submitterEmail")) entity.setSubmitterEmail(dto.getSubmitterEmail());
        if (fields.contains("submitterPhone")) entity.setSubmitterPhone(dto.getSubmitterPhone());
        if (fields.contains("localUuid")) entity.setLocalUuid(dto.getLocalUuid());
        entity.setSharepointId(dto.getSharepointId());
    }

    private void syncAttachmentsSafely(Long entityId, String sharepointId) {
        try {
            permitAttachmentSyncService.syncAttachmentsForFieldListItem(entityId, sharepointId);
        } catch (Exception e) {
            log.warn("[FieldList Syncable] Attachment sync failed for spId={}: {}", sharepointId, e.getMessage());
        }
    }

    @Override
    public Long findLocalEntityId(String sharepointId) {
        return repo.findFirstBySharepointIdOrderByIdAsc(sharepointId)
            .map(FieldListItem::getId)
            .orElse(null);
    }
}
