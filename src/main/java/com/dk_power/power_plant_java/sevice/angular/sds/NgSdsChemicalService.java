package com.dk_power.power_plant_java.sevice.angular.sds;

import com.dk_power.power_plant_java.config.SyncConfig;
import com.dk_power.power_plant_java.dto.pa.PaAttachmentDto;
import com.dk_power.power_plant_java.dto.sds.SdsChemicalDto;
import com.dk_power.power_plant_java.dto.sds.SdsImportItemDto;
import com.dk_power.power_plant_java.dto.sds.SdsImportReportDto;
import com.dk_power.power_plant_java.dto.sds.SdsSyncReportDto;
import com.dk_power.power_plant_java.entities.permits.PermitAttachment;
import com.dk_power.power_plant_java.entities.sds.SdsChemical;
import com.dk_power.power_plant_java.mappers.sds.SdsChemicalMapper;
import com.dk_power.power_plant_java.repository.permits.PermitAttachmentRepo;
import com.dk_power.power_plant_java.repository.sds.SdsChemicalRepo;
import com.dk_power.power_plant_java.sevice.angular.NgValueService;
import com.dk_power.power_plant_java.sevice.angular.permits.WorkAreaGitHubPublisher;
import com.dk_power.power_plant_java.sevice.sharepoint.adapters.SdsChemicalSharePointAdapter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.MessageDigest;
import java.util.ArrayList;
import java.util.Base64;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class NgSdsChemicalService {

    public static final String STATUS_CATEGORY = "SdsStatus";
    public static final String STATUS_INCOMING = "Incoming";
    public static final String STATUS_PENDING = "Pending";
    public static final String STATUS_FILED = "Filed";
    public static final String STATUS_REMOVED = "Removed";

    private static final List<String> ACTIVE_STATUSES = List.of(STATUS_INCOMING, STATUS_PENDING, STATUS_FILED);
    private static final List<String> UNPROCESSED_STATUSES = List.of(STATUS_INCOMING, STATUS_PENDING);

    private final SdsChemicalRepo repo;
    private final SdsChemicalMapper mapper;
    private final NgValueService valueService;
    private final PermitAttachmentRepo attachmentRepo;
    private final SdsChemicalSharePointAdapter spAdapter;
    private final SyncConfig syncConfig;
    private final ObjectProvider<WorkAreaGitHubPublisher> gitHubPublisherProvider;

    /** Refresh the GitHub Pages snapshot the PWA falls back to when the hub is offline. */
    private void publishToPwaSnapshot() {
        WorkAreaGitHubPublisher publisher = gitHubPublisherProvider.getIfAvailable();
        if (publisher != null) publisher.publishSdsChemicals();
    }

    public List<SdsChemicalDto> getAll() {
        return mapper.convertToDtos(repo.findAll());
    }

    public List<SdsChemicalDto> getActive() {
        return mapper.convertToDtos(repo.findByStatus_NameIn(ACTIVE_STATUSES));
    }

    public List<SdsChemicalDto> getByStatus(String statusName) {
        return mapper.convertToDtos(repo.findByStatus_NameIgnoreCase(statusName));
    }

    /** Items that still need processing — Incoming (raw PDF dump) + Pending (intake started). */
    public List<SdsChemicalDto> getUnprocessed() {
        return mapper.convertToDtos(repo.findByStatus_NameIn(UNPROCESSED_STATUSES));
    }

    public SdsChemicalDto getDtoById(Long id) {
        return repo.findById(id).map(mapper::convertToDto).orElse(null);
    }

    public SdsChemical getEntity() {
        return new SdsChemical();
    }

    public SdsChemicalDto save(SdsChemicalDto dto) {
        SdsChemical entity;
        if (dto.getId() != null) {
            entity = repo.findById(dto.getId()).orElse(new SdsChemical());
        } else {
            entity = new SdsChemical();
        }

        entity.setNames(dto.getNames());
        entity.setLocations(dto.getLocations());
        entity.setNotes(dto.getNotes());
        entity.setProcessedByName(dto.getProcessedByName());
        entity.setProcessedByEmail(dto.getProcessedByEmail());
        entity.setProcessedAt(dto.getProcessedAt());
        entity.setSubmitterName(dto.getSubmitterName());
        entity.setSubmitterEmail(dto.getSubmitterEmail());
        entity.setSubmitterPhone(dto.getSubmitterPhone());
        if (dto.getBookNumber() != null) entity.setBookNumber(dto.getBookNumber());
        if (dto.getSectionNumber() != null) entity.setSectionNumber(dto.getSectionNumber());

        if (dto.getStatusName() != null) {
            entity.setStatus(valueService.createValue(STATUS_CATEGORY, dto.getStatusName()));
        } else if (entity.getStatus() == null) {
            entity.setStatus(valueService.createValue(STATUS_CATEGORY, STATUS_PENDING));
        }

        // Stamp a localUuid on first save so the hub's outbound SP push + inbound pull can bind it.
        if (entity.getLocalUuid() == null || entity.getLocalUuid().isBlank()) {
            entity.setLocalUuid(UUID.randomUUID().toString());
        }

        entity = repo.save(entity);

        // Best-effort SP push for updates that already have a SP id
        if (entity.getSharepointId() != null) {
            try {
                spAdapter.update(entity.getSharepointId(), mapper.convertToDto(entity));
            } catch (Exception e) {
                log.warn("[SDS] SP update failed for spId={}: {}", entity.getSharepointId(), e.getMessage());
            }
        }
        publishToPwaSnapshot();
        return mapper.convertToDto(entity);
    }

    /**
     * Bind a book-only chemical (synthetic {@code BOOK-{book}-{section}} sourceId, or any chemical
     * whose sourceId is no longer in the eBinder) to a real eBinder Document ID. Updates in place
     * — preserves the row id, audit history, sync events, and Book/Section. After this call, a
     * subsequent close-gaps scrape will attach the PDF for the new sourceId.
     */
    public SdsChemicalDto matchToSource(Long id, String newSourceId, String mergedNames) {
        SdsChemical entity = repo.findById(id).orElseThrow(() ->
                new RuntimeException("SdsChemical not found: " + id));
        entity.setSourceId(newSourceId);
        if (mergedNames != null && !mergedNames.isBlank()) entity.setNames(mergedNames);
        entity = repo.save(entity);

        if (entity.getSharepointId() != null) {
            try {
                spAdapter.update(entity.getSharepointId(), mapper.convertToDto(entity));
            } catch (Exception e) {
                log.warn("[SDS] SP update after match failed for spId={}: {}", entity.getSharepointId(), e.getMessage());
            }
        }
        publishToPwaSnapshot();
        return mapper.convertToDto(entity);
    }

    public SdsChemicalDto changeStatus(Long id, String statusName) {
        SdsChemical entity = repo.findById(id).orElseThrow(() ->
                new RuntimeException("SdsChemical not found: " + id));
        entity.setStatus(valueService.createValue(STATUS_CATEGORY, statusName));
        entity = repo.save(entity);

        if (entity.getSharepointId() != null) {
            try {
                spAdapter.changeStatus(entity.getSharepointId(), statusName);
            } catch (Exception e) {
                log.warn("[SDS] SP status change failed for spId={}: {}", entity.getSharepointId(), e.getMessage());
            }
        }
        publishToPwaSnapshot();
        return mapper.convertToDto(entity);
    }

    /**
     * Admin bulk dump: create one Incoming chemical per uploaded PDF (no metadata yet).
     * The file name (sans extension) becomes a placeholder primary name for operators to refine.
     */
    public int dumpIncoming(List<Map<String, String>> files) {
        if (files == null) return 0;
        int created = 0;
        for (Map<String, String> f : files) {
            String fileName = f.get("fileName");
            String base64 = f.get("base64Content");
            if (base64 == null || base64.isBlank()) continue;
            String contentType = f.getOrDefault("contentType", "application/pdf");

            SdsChemical entity = new SdsChemical();
            entity.setLocalUuid(UUID.randomUUID().toString());
            entity.setStatus(valueService.createValue(STATUS_CATEGORY, STATUS_INCOMING));
            entity.setNames(stripExtension(fileName));
            entity = repo.saveAndFlush(entity);

            uploadAttachment(entity.getId(), fileName, contentType, base64);
            created++;
        }
        if (created > 0) publishToPwaSnapshot();
        return created;
    }

    private static String stripExtension(String fileName) {
        if (fileName == null) return "";
        int dot = fileName.lastIndexOf('.');
        return dot > 0 ? fileName.substring(0, dot) : fileName;
    }

    // ============ Source import + reconcile (scraper) ============

    /**
     * Import a full snapshot scraped from the source eBinder and reconcile it against our DB.
     * Matches by {@code sourceId} (the eBinder item id): new items are created as Incoming with the
     * SDS PDF attached; existing items get names/manufacturer/revision refreshed (a changed revision
     * date is flagged). Active chemicals whose sourceId is absent from the snapshot are reported as
     * missing-from-source. Names/locations/book/section/status of existing rows are otherwise kept.
     */
    public SdsImportReportDto importFromSource(List<SdsImportItemDto> items) {
        SdsImportReportDto report = new SdsImportReportDto();
        if (items == null) return report;
        report.setSourceCount(items.size());

        Set<String> sourceIds = new HashSet<>();
        for (SdsImportItemDto item : items) {
            String sourceId = item.getSourceItemId();
            if (sourceId == null || sourceId.isBlank()) continue;   // can't match without an id
            sourceIds.add(sourceId);

            String names = normalizeNames(item.getNames());
            String primary = SdsChemicalMapper.primaryName(names);
            String label = primary != null ? primary : sourceId;

            SdsChemical entity = repo.findFirstBySourceIdOrderByIdAsc(sourceId).orElse(null);
            boolean isNew = entity == null;
            if (isNew) {
                entity = new SdsChemical();
                entity.setSourceId(sourceId);
                entity.setLocalUuid(UUID.randomUUID().toString());
                entity.setStatus(valueService.createValue(STATUS_CATEGORY, STATUS_INCOMING));
            } else if (item.getRevisionDate() != null
                    && !item.getRevisionDate().equals(entity.getSourceRevisionDate())) {
                report.getRevisedChemicals().add(label);
            }

            if (names != null) entity.setNames(names);
            if (item.getManufacturer() != null) entity.setManufacturer(item.getManufacturer());
            if (item.getRevisionDate() != null) entity.setSourceRevisionDate(item.getRevisionDate());
            // Merge step carries Book/Section from the index; the PDF pass leaves them null (don't clobber).
            if (item.getBookNumber() != null) entity.setBookNumber(item.getBookNumber());
            if (item.getSectionNumber() != null) entity.setSectionNumber(item.getSectionNumber());
            // A new chemical that already has a physical address is already Filed, not Incoming.
            if (isNew && entity.getBookNumber() != null && entity.getSectionNumber() != null) {
                entity.setStatus(valueService.createValue(STATUS_CATEGORY, STATUS_FILED));
            }
            entity = repo.saveAndFlush(entity);

            if (isNew) {
                report.setCreated(report.getCreated() + 1);
                report.getNewChemicals().add(label);
            } else {
                report.setUpdated(report.getUpdated() + 1);
            }

            PaAttachmentDto pdf = item.getPdf();
            if (pdf != null && pdf.getBase64Content() != null && !pdf.getBase64Content().isBlank()) {
                String hash = computeContentHash(pdf.getBase64Content());
                boolean dup = attachmentRepo.existsByEntityTypeAndEntityIdAndFileNameAndContentHash(
                        SdsChemicalMapper.ENTITY_TYPE, entity.getId(), pdf.getFileName(), hash);
                if (!dup) {
                    // origin="ebinder" tags this row as scraper-owned so a future Sync PDFs run
                    // recognizes it as replaceable (manual uploads keep origin=null and survive).
                    uploadAttachment(entity.getId(), pdf.getFileName(), pdf.getContentType(),
                        pdf.getBase64Content(), "ebinder");
                    report.setPdfsAttached(report.getPdfsAttached() + 1);
                }
            }
        }

        // Source reconcile: active chemicals that came from the eBinder (have a sourceId) but are no
        // longer present in this snapshot — candidates for removal at the source.
        for (SdsChemical c : repo.findByStatus_NameIn(ACTIVE_STATUSES)) {
            String sid = c.getSourceId();
            if (sid != null && !sid.isBlank() && !sourceIds.contains(sid)) {
                report.getMissingFromSource().add(SdsChemicalMapper.primaryName(c.getNames()));
            }
        }
        if (report.getCreated() > 0 || report.getUpdated() > 0) publishToPwaSnapshot();
        return report;
    }

    /**
     * Reconcile only: given the full set of sourceIds present in the latest eBinder snapshot, return
     * the primary names of active chemicals that came from the eBinder (have a sourceId) but are no
     * longer present. Used after a batched import to compute missing-from-source in one call.
     */
    public List<String> reconcileMissing(List<String> sourceIds) {
        Set<String> present = sourceIds == null ? Set.of() : new HashSet<>(sourceIds);
        List<String> missing = new ArrayList<>();
        for (SdsChemical c : repo.findByStatus_NameIn(ACTIVE_STATUSES)) {
            String sid = c.getSourceId();
            if (sid != null && !sid.isBlank() && !present.contains(sid)) {
                missing.add(SdsChemicalMapper.primaryName(c.getNames()));
            }
        }
        return missing;
    }

    /** Accept names as comma-separated (eBinder) or newline-separated; return newline-delimited. */
    private static String normalizeNames(String raw) {
        if (raw == null) return null;
        String[] parts = raw.contains("\n") ? raw.split("\\r?\\n") : raw.split(",");
        StringBuilder sb = new StringBuilder();
        for (String p : parts) {
            String t = p.trim();
            if (!t.isEmpty()) {
                if (sb.length() > 0) sb.append("\n");
                sb.append(t);
            }
        }
        return sb.toString();
    }

    // ============ Attachments ============

    /** Default path — used by the desktop upload button and PWA submit → manually-added,
     *  {@code origin=null}. Preserved by the Sync PDFs tool. */
    public PermitAttachment uploadAttachment(Long entityId, String fileName, String contentType, String base64Content) {
        return uploadAttachment(entityId, fileName, contentType, base64Content, null);
    }

    /** Full form — {@code origin='ebinder'} on scraper-added PDFs so Sync PDFs can recognize
     *  and replace them. Any other value (or {@code null}) marks the row as manual. */
    public PermitAttachment uploadAttachment(Long entityId, String fileName, String contentType,
                                             String base64Content, String origin) {
        String hash = computeContentHash(base64Content);

        PermitAttachment att = new PermitAttachment();
        att.setEntityType(SdsChemicalMapper.ENTITY_TYPE);
        att.setEntityId(entityId);
        att.setFileName(fileName);
        att.setContentType(contentType);
        att.setAttachmentType(contentType != null && contentType.startsWith("image/") ? "photo" : "document");
        att.setBase64Content(base64Content);
        att.setContentHash(hash);
        att.setOriginMachineId(syncConfig.getMachineId());
        att.setOrigin(origin);
        att.setSyncedToServer(false);
        att = attachmentRepo.save(att);

        SdsChemical entity = repo.findById(entityId).orElse(null);
        if (entity != null && entity.getSharepointId() != null) {
            try {
                PaAttachmentDto paAtt = new PaAttachmentDto();
                paAtt.setFileName(fileName);
                paAtt.setContentType(contentType);
                paAtt.setBase64Content(base64Content);
                spAdapter.addAttachment(entity.getSharepointId(), paAtt);
            } catch (Exception e) {
                log.warn("[SDS] SP attachment upload failed: {}", e.getMessage());
            }
        }
        return att;
    }

    public void deleteAttachment(Long entityId, Long attachmentId) {
        attachmentRepo.deleteById(attachmentId);
    }

    /**
     * Admin helper: push every local SDS chemical to SharePoint — create rows that don't yet
     * exist (capturing the new SP id) and update those that do, then replace each item's SP
     * attachments with the local ones (delete-all-then-re-add to avoid duplicate-filename 409s).
     * <p>
     * <b>Stale-id recovery:</b> if a local chemical has a {@code sharepointId} but the matching SP
     * row no longer exists (e.g. someone deleted the list and recreated it), the update will fail
     * — we catch that, clear the dead id, create a fresh SP row, and rebind. So this helper works
     * as a one-shot "make SharePoint match local" even when the SP list is empty or out of sync.
     * Per-row errors after that fallback are logged and added to the report so one bad row doesn't
     * abort the rest.
     */
    public SdsSyncReportDto pushAllToSharePoint() {
        SdsSyncReportDto rep = new SdsSyncReportDto();
        for (SdsChemical c : repo.findAll()) {
            try {
                SdsChemicalDto dto = mapper.convertToDto(c);
                if (c.getSharepointId() == null || c.getSharepointId().isBlank()) {
                    String newSpId = spAdapter.create(dto);
                    c.setSharepointId(newSpId);
                    c = repo.save(c);
                    rep.setChemicalsCreated(rep.getChemicalsCreated() + 1);
                } else {
                    try {
                        spAdapter.update(c.getSharepointId(), dto);
                        rep.setChemicalsUpdated(rep.getChemicalsUpdated() + 1);
                    } catch (Exception updateEx) {
                        // SP row is gone (list reset, manual delete, etc.) — rebind by creating a fresh one.
                        log.info("[SDS] push: update failed for spId={} ({}), recreating", c.getSharepointId(), updateEx.getMessage());
                        String staleId = c.getSharepointId();
                        c.setSharepointId(null);
                        dto.setSharepointId(null);
                        String newSpId = spAdapter.create(dto);
                        if (newSpId == null || newSpId.isBlank()) {
                            throw new RuntimeException("recreate after stale id " + staleId + " returned no SP id", updateEx);
                        }
                        c.setSharepointId(newSpId);
                        c = repo.save(c);
                        rep.setChemicalsCreated(rep.getChemicalsCreated() + 1);
                    }
                }
                // Replace attachments: delete-all-then-re-push to avoid SP's duplicate filename refusal.
                // Skip tombstoned rows — Sync PDFs marks superseded rows deleted=true for peer
                // propagation, and this push would silently resurrect them on SharePoint.
                List<PermitAttachment> atts = attachmentRepo.findByEntityTypeAndEntityIdAndDeletedFalse(
                        SdsChemicalMapper.ENTITY_TYPE, c.getId());
                if (c.getSharepointId() != null) {
                    int removed = spAdapter.deleteAllAttachments(c.getSharepointId());
                    rep.setAttachmentsRemoved(rep.getAttachmentsRemoved() + removed);
                    for (PermitAttachment a : atts) {
                        if (a.getBase64Content() == null || a.getBase64Content().isBlank()) continue;
                        PaAttachmentDto paAtt = new PaAttachmentDto();
                        paAtt.setFileName(a.getFileName());
                        paAtt.setContentType(a.getContentType());
                        paAtt.setBase64Content(a.getBase64Content());
                        try {
                            spAdapter.addAttachment(c.getSharepointId(), paAtt);
                            rep.setAttachmentsAdded(rep.getAttachmentsAdded() + 1);
                        } catch (Exception ax) {
                            rep.getErrors().add("attach '" + a.getFileName() + "' to " + c.getId() + ": " + ax.getMessage());
                        }
                    }
                }
            } catch (Exception e) {
                String label = c.getId() + " (" + SdsChemicalMapper.primaryName(c.getNames()) + ")";
                rep.getErrors().add("push " + label + ": " + e.getMessage());
                log.warn("[SDS] push to SP failed for chemical {}: {}", label, e.getMessage());
            }
        }
        log.info("[SDS] pushAllToSharePoint: +{} created, ~{} updated, +{} attachments (after removing {})",
                rep.getChemicalsCreated(), rep.getChemicalsUpdated(),
                rep.getAttachmentsAdded(), rep.getAttachmentsRemoved());
        return rep;
    }

    /**
     * Admin helper: pull every SDS row from SharePoint and reconcile local. Upserts chemicals by
     * SharePoint id (creates missing locals, updates existing ones with SP's values), then for
     * each chemical fetches its SP attachments and replaces the local attachment set so the local
     * mirror matches SP exactly.
     * <p>
     * Goes through {@code repo.save()} so every change fires field-level sync events — the hub
     * picks them up and broadcasts to other clients (just like seeding). Attachments are saved
     * with {@code syncedToServer=false} so the AttachmentSyncHandler pushes them up to the hub
     * and other clients can download them. No SharePoint re-push happens (SP IS the source here).
     */
    public SdsSyncReportDto pullAllFromSharePoint() {
        SdsSyncReportDto rep = new SdsSyncReportDto();
        List<SdsChemicalDto> remote;
        try { remote = spAdapter.getAll(); }
        catch (Exception e) {
            rep.getErrors().add("getAll from SP failed: " + e.getMessage());
            log.warn("[SDS] pullAllFromSharePoint: SP getAll failed: {}", e.getMessage());
            return rep;
        }
        for (SdsChemicalDto dto : remote) {
            try {
                if (dto.getSharepointId() == null || dto.getSharepointId().isBlank()) continue;
                SdsChemical entity = repo.findFirstBySharepointIdOrderByIdAsc(dto.getSharepointId()).orElse(null);
                boolean isNew = entity == null;
                if (isNew) {
                    entity = new SdsChemical();
                    entity.setSharepointId(dto.getSharepointId());
                    if (dto.getLocalUuid() != null && !dto.getLocalUuid().isBlank()) {
                        entity.setLocalUuid(dto.getLocalUuid());
                    } else {
                        entity.setLocalUuid(UUID.randomUUID().toString());
                    }
                }
                entity.setNames(dto.getNames());
                entity.setLocations(dto.getLocations());
                entity.setBookNumber(dto.getBookNumber());
                entity.setSectionNumber(dto.getSectionNumber());
                entity.setNotes(dto.getNotes());
                entity.setSourceId(dto.getSourceId());
                entity.setManufacturer(dto.getManufacturer());
                entity.setSourceRevisionDate(dto.getSourceRevisionDate());
                entity.setProcessedByName(dto.getProcessedByName());
                entity.setProcessedByEmail(dto.getProcessedByEmail());
                entity.setSubmitterName(dto.getSubmitterName());
                entity.setSubmitterEmail(dto.getSubmitterEmail());
                entity.setSubmitterPhone(dto.getSubmitterPhone());
                if (dto.getStatusName() != null && !dto.getStatusName().isBlank()) {
                    entity.setStatus(valueService.createValue(STATUS_CATEGORY, dto.getStatusName()));
                } else if (entity.getStatus() == null) {
                    entity.setStatus(valueService.createValue(STATUS_CATEGORY, STATUS_FILED));
                }
                entity = repo.saveAndFlush(entity);
                if (isNew) rep.setChemicalsCreated(rep.getChemicalsCreated() + 1);
                else rep.setChemicalsUpdated(rep.getChemicalsUpdated() + 1);

                // Replace local attachments with SP's set.
                List<PermitAttachment> existing = attachmentRepo.findByEntityTypeAndEntityId(
                        SdsChemicalMapper.ENTITY_TYPE, entity.getId());
                if (!existing.isEmpty()) {
                    attachmentRepo.deleteAll(existing);
                    rep.setAttachmentsRemoved(rep.getAttachmentsRemoved() + existing.size());
                }
                List<PaAttachmentDto> spAtts;
                try { spAtts = spAdapter.getAttachments(dto.getSharepointId()); }
                catch (Exception ax) {
                    rep.getErrors().add("getAttachments " + dto.getSharepointId() + ": " + ax.getMessage());
                    continue;
                }
                for (PaAttachmentDto a : spAtts) {
                    if (a.getBase64Content() == null || a.getBase64Content().isBlank()) continue;
                    uploadAttachmentFromSp(entity.getId(), a.getFileName(), a.getContentType(), a.getBase64Content());
                    rep.setAttachmentsAdded(rep.getAttachmentsAdded() + 1);
                }
            } catch (Exception e) {
                rep.getErrors().add("pull SP id " + dto.getSharepointId() + ": " + e.getMessage());
                log.warn("[SDS] pullAllFromSharePoint: row {} failed: {}", dto.getSharepointId(), e.getMessage());
            }
        }
        log.info("[SDS] pullAllFromSharePoint: +{} created, ~{} updated, +{} attachments (replaced {})",
                rep.getChemicalsCreated(), rep.getChemicalsUpdated(),
                rep.getAttachmentsAdded(), rep.getAttachmentsRemoved());
        if (rep.getChemicalsCreated() > 0 || rep.getChemicalsUpdated() > 0) publishToPwaSnapshot();
        return rep;
    }

    /**
     * Admin helper: soft-delete every local SDS chemical so the wipe propagates everywhere.
     * <p>
     * Each chemical is saved with {@code deleted=true} via {@code repo.save()} — the
     * {@code FieldChangeEntityListener} fires a field-level sync event for {@code deleted}, the
     * hub broadcasts it to every other client (they soft-delete too), and the hub's
     * {@link com.dk_power.power_plant_java.sevice.sharepoint.SdsOutboundSharePointSync#pushDeletes}
     * sweep hard-deletes the SP rows within a minute. Local attachment rows are hard-deleted
     * (PermitAttachment isn't field-synced — clients will drop them when they soft-delete the
     * parent chemical, and the hub's outbound SP delete strips SP attachments along with the row).
     */
    public SdsSyncReportDto clearAll() {
        SdsSyncReportDto rep = new SdsSyncReportDto();
        for (SdsChemical c : repo.findAll()) {
            try {
                List<PermitAttachment> atts = attachmentRepo.findByEntityTypeAndEntityId(
                        SdsChemicalMapper.ENTITY_TYPE, c.getId());
                if (!atts.isEmpty()) {
                    attachmentRepo.deleteAll(atts);
                    rep.setAttachmentsRemoved(rep.getAttachmentsRemoved() + atts.size());
                }
                c.setDeleted(true);
                repo.save(c);   // fires sync events → hub broadcasts + queues SP delete
                rep.setChemicalsDeleted(rep.getChemicalsDeleted() + 1);
            } catch (Exception e) {
                rep.getErrors().add("delete " + c.getId() + ": " + e.getMessage());
                log.warn("[SDS] clearAll: row {} failed: {}", c.getId(), e.getMessage());
            }
        }
        log.info("[SDS] clearAll: soft-deleted {} chemical(s), removed {} attachment(s); hub will propagate to clients + SP",
                rep.getChemicalsDeleted(), rep.getAttachmentsRemoved());
        if (rep.getChemicalsDeleted() > 0) publishToPwaSnapshot();
        return rep;
    }

    /**
     * Save an attachment that came from SharePoint: don't re-push to SP (it's the source), but DO
     * leave {@code syncedToServer=false} so {@code AttachmentSyncHandler} carries it up to the hub
     * and out to the other clients.
     */
    private void uploadAttachmentFromSp(Long entityId, String fileName, String contentType, String base64Content) {
        String hash = computeContentHash(base64Content);
        PermitAttachment att = new PermitAttachment();
        att.setEntityType(SdsChemicalMapper.ENTITY_TYPE);
        att.setEntityId(entityId);
        att.setFileName(fileName);
        att.setContentType(contentType);
        att.setAttachmentType(contentType != null && contentType.startsWith("image/") ? "photo" : "document");
        att.setBase64Content(base64Content);
        att.setContentHash(hash);
        att.setOriginMachineId(syncConfig.getMachineId());
        // origin='sharepoint' marks rows that came FROM SP via pullAllFromSharePoint. Without
        // this tag, Sync PDFs' isScraperOwned filter couldn't see them and they'd survive every
        // reconcile run — the exact "ghost row" bug that had wrong PDFs sticking around after
        // pull-from-SP → close-gaps cycles.
        att.setOrigin("sharepoint");
        att.setSyncedToServer(false);   // let AttachmentSyncHandler ship it to hub → other clients
        attachmentRepo.save(att);
    }

    /**
     * Admin/test affordance: drop every PDF (PermitAttachment) for every SDS chemical AND remove
     * matching SharePoint attachments, so the next scrape can re-download clean copies without
     * SharePoint's "duplicate filename" check blocking the new upload (which previously left only
     * the stale broken file on SP).
     */
    public int clearAllPdfs() {
        int localTotal = 0;
        int spTotal = 0;
        for (SdsChemical c : repo.findAll()) {
            List<PermitAttachment> atts = attachmentRepo.findByEntityTypeAndEntityId(
                    SdsChemicalMapper.ENTITY_TYPE, c.getId());
            if (!atts.isEmpty()) {
                attachmentRepo.deleteAll(atts);
                localTotal += atts.size();
            }
            if (c.getSharepointId() != null && !c.getSharepointId().isBlank()) {
                try { spTotal += spAdapter.deleteAllAttachments(c.getSharepointId()); }
                catch (Exception e) { log.warn("[SDS] SP cleanup failed for spId={}: {}", c.getSharepointId(), e.getMessage()); }
            }
        }
        log.info("[SDS] cleared {} local PDF attachments and {} SharePoint attachments", localTotal, spTotal);
        return localTotal;
    }

    public void softDelete(Long id) {
        repo.findById(id).ifPresent(entity -> {
            entity.setDeleted(true);
            repo.save(entity);
            publishToPwaSnapshot();
        });
    }

    private String computeContentHash(String base64Content) {
        if (base64Content == null || base64Content.isEmpty()) return null;
        try {
            byte[] bytes = Base64.getDecoder().decode(base64Content);
            byte[] hash = MessageDigest.getInstance("SHA-256").digest(bytes);
            StringBuilder sb = new StringBuilder(hash.length * 2);
            for (byte b : hash) sb.append(String.format("%02x", b));
            return sb.toString();
        } catch (Exception e) {
            return null;
        }
    }
}
