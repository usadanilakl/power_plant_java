package com.dk_power.power_plant_java.sevice.angular.sds;

import com.dk_power.power_plant_java.config.SyncConfig;
import com.dk_power.power_plant_java.dto.pa.PaAttachmentDto;
import com.dk_power.power_plant_java.dto.sds.SdsImportItemDto;
import com.dk_power.power_plant_java.dto.sds.SdsSyncPdfsReportDto;
import com.dk_power.power_plant_java.entities.permits.PermitAttachment;
import com.dk_power.power_plant_java.entities.sds.SdsChemical;
import com.dk_power.power_plant_java.mappers.sds.SdsChemicalMapper;
import com.dk_power.power_plant_java.repository.permits.PermitAttachmentRepo;
import com.dk_power.power_plant_java.repository.sds.SdsChemicalRepo;
import com.dk_power.power_plant_java.sevice.sharepoint.adapters.SdsChemicalSharePointAdapter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.List;

/**
 * "Sync PDFs with eBinder" — for each item in an eBinder walk, reconcile that chemical's PDF
 * attachments across the local DB and SharePoint. Content-hash driven so re-runs on already-
 * synced items are no-ops. Only touches attachments tagged {@code origin='ebinder'}; manual
 * uploads survive even on matched chemicals.
 * <p>
 * <b>Ordering guarantees for a single chemical replace:</b>
 * <ol>
 *   <li>Insert the new PermitAttachment locally (marked {@code syncedToServer=false}). Now local
 *       has {stale, new}; the new row's hash is present so future runs' hash-match short-circuit
 *       correctly even if the following steps fail.</li>
 *   <li>Add the new PDF to SharePoint. If SP allows duplicate filenames the old PDF is still
 *       there; either way SP is never empty during the window. If SP add throws we abort the
 *       replace before deleting anything else — local has an extra new row, next run's hash
 *       check will treat it as unchanged (see {@code alreadyUpToDate}).</li>
 *   <li>Delete old SharePoint attachments (all except the one we just added).</li>
 *   <li>Tombstone-and-save old local rows via {@link AttachmentSyncHandler}-visible path so the
 *       delete propagates to peers.</li>
 * </ol>
 * <p>
 * <b>Preservation:</b> Only attachments with {@code origin='ebinder'} (or the legacy filename
 * pattern {@code sds-*.pdf} for pre-tag rows) are considered scraper-owned and eligible for
 * replacement. Any other attachment on a matched chemical (a manual reference, a supplemental
 * MSDS from vendor email) is invisible to this tool.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SdsSyncPdfsService {

    private static final String EBINDER_ORIGIN = "ebinder";

    /** Legacy identifier for scraper-added attachments that predate the {@code origin} column.
     *  Every filename produced by {@link com.dk_power.power_plant_java...WebViewSdsManager}'s
     *  capturePdf matches this shape. Rows matching it are treated as if {@code origin='ebinder'}. */
    private static final java.util.regex.Pattern LEGACY_SCRAPER_FILENAME =
            java.util.regex.Pattern.compile("^sds-[^ ]+\\.pdf$", java.util.regex.Pattern.CASE_INSENSITIVE);

    /** A PDF smaller than this is almost certainly an error page or truncated download.
     *  Real SDSes are never this small in practice — the smallest legit ones are 30+ KB. */
    private static final int MIN_PDF_BYTES = 10 * 1024;

    private final SdsChemicalRepo repo;
    private final PermitAttachmentRepo attachmentRepo;
    private final SdsChemicalSharePointAdapter spAdapter;
    private final SyncConfig syncConfig;

    /**
     * Entry point. Walks the provided eBinder catalog batch, reconciling each item.
     * <p>
     * <b>No batch-level transaction on purpose.</b> Each Stage A save autocommits, so a failure
     * halfway through the batch does NOT roll back already-committed rows on SP. That would be
     * catastrophic — SP would hold PDFs uploaded by the successful items while the local DB
     * pretends they never happened, and every future Sync PDFs run would see stale-hash local
     * rows and re-upload duplicates. Stage B and D swallow their own failures and record them
     * as per-item errors so retries can converge without transactional entanglement.
     * @param items   scraped eBinder rows with sourceItemId + optional PDF payload
     * @param dryRun  when true, no writes to local or SP; report shows what WOULD change
     * @param report  accumulator — safe to pass across batches from the scraper
     */
    public void reconcileBatch(List<SdsImportItemDto> items, boolean dryRun, SdsSyncPdfsReportDto report) {
        if (items == null || items.isEmpty()) return;
        report.setDryRun(dryRun || report.isDryRun());

        for (SdsImportItemDto item : items) {
            reconcileOne(item, dryRun, report);
        }
    }

    /**
     * Preflight the hub before any run. Blocks the sync if invariants are broken (e.g. two
     * chemicals sharing the same SharePoint id — a cross-chemical data-loss risk).
     */
    public void runPreflight(SdsSyncPdfsReportDto report) {
        List<String> dupSpIds = repo.findDuplicateSharepointIds();
        if (!dupSpIds.isEmpty()) {
            report.getPreflightBlockers().add(
                "Multiple chemicals share the same SharePoint id — deduplicate before running Sync PDFs: "
                + String.join(", ", dupSpIds));
        }
    }

    // ─── Per-chemical reconcile ────────────────────────────────────────────────────────

    private void reconcileOne(SdsImportItemDto item, boolean dryRun, SdsSyncPdfsReportDto report) {
        report.setChemicalsChecked(report.getChemicalsChecked() + 1);

        String sourceId = item.getSourceItemId();
        if (sourceId == null || sourceId.isBlank()) return;

        // 1. Find local by sourceId. If ambiguous (multiple rows share the id), refuse to touch.
        List<SdsChemical> matches = repo.findAllBySourceId(sourceId);
        if (matches.isEmpty()) {
            report.setNotInOurSystem(report.getNotInOurSystem() + 1);
            return;
        }
        if (matches.size() > 1) {
            report.setAmbiguousSourceId(report.getAmbiguousSourceId() + 1);
            report.getErrors().add(new SdsSyncPdfsReportDto.ErrorEntry(
                sourceId, primaryName(matches.get(0)),
                "PREFLIGHT",
                "Multiple local chemicals share this sourceId (ids: "
                    + matches.stream().map(c -> c.getId().toString()).reduce((a, b) -> a + "," + b).orElse("")
                    + "). Skipping to avoid picking the wrong one."));
            return;
        }
        SdsChemical entity = matches.get(0);
        String chemLabel = primaryName(entity);

        // 2. Validate the incoming PDF before doing ANY writes. Missing or invalid → skip and
        //    preserve existing attachments. This is the preservation guarantee: a bad scrape
        //    can't overwrite a good local copy.
        PaAttachmentDto pdf = item.getPdf();
        if (pdf == null || pdf.getBase64Content() == null || pdf.getBase64Content().isBlank()) {
            report.setEbinderHadNoPdf(report.getEbinderHadNoPdf() + 1);
            return;
        }
        byte[] decoded;
        try {
            decoded = decodeBase64Strict(pdf.getBase64Content());
        } catch (IllegalArgumentException ex) {
            report.setRejectedInvalidPdf(report.getRejectedInvalidPdf() + 1);
            report.getErrors().add(new SdsSyncPdfsReportDto.ErrorEntry(
                sourceId, chemLabel, "HASH", "Base64 decode failed: " + ex.getMessage()));
            return;
        }
        String pdfValidationError = validatePdf(decoded);
        if (pdfValidationError != null) {
            report.setRejectedInvalidPdf(report.getRejectedInvalidPdf() + 1);
            report.getErrors().add(new SdsSyncPdfsReportDto.ErrorEntry(
                sourceId, chemLabel, "CAPTURE", pdfValidationError));
            return;
        }
        String newHash = sha256Hex(decoded);
        if (newHash == null) {
            report.setRejectedInvalidPdf(report.getRejectedInvalidPdf() + 1);
            report.getErrors().add(new SdsSyncPdfsReportDto.ErrorEntry(
                sourceId, chemLabel, "HASH", "SHA-256 unavailable"));
            return;
        }

        // 3. Hash-match check against LIVE, scraper-owned attachments only. If a matching row
        //    already exists, we're in sync — skip. Manual attachments are ignored either way.
        List<PermitAttachment> allLive = attachmentRepo.findByEntityTypeAndEntityIdAndDeletedFalse(
                SdsChemicalMapper.ENTITY_TYPE, entity.getId());
        List<PermitAttachment> scraperOwned = allLive.stream().filter(this::isScraperOwned).toList();
        boolean matchExists = scraperOwned.stream().anyMatch(a -> newHash.equalsIgnoreCase(a.getContentHash()));
        if (matchExists) {
            report.setAlreadyUpToDate(report.getAlreadyUpToDate() + 1);
            return;
        }

        // 4. Replace path. Dry-run reports the intent and exits.
        if (dryRun) {
            report.setUpdated(report.getUpdated() + 1);
            return;
        }
        replace(entity, chemLabel, sourceId, pdf, newHash, decoded.length, scraperOwned, report);
    }

    private void replace(SdsChemical entity, String chemLabel, String sourceId,
                         PaAttachmentDto pdf, String newHash, int decodedLen,
                         List<PermitAttachment> oldScraperRows, SdsSyncPdfsReportDto report) {
        String spId = entity.getSharepointId();
        boolean hasSpId = spId != null && !spId.isBlank();

        // Compute the SP filename FIRST — same name on local and SP so Stage C's delete-by-name
        // targets the actual row we uploaded. (Prior bug: local kept the raw eBinder name while
        // SP got the hash-suffixed one; the next run's Stage C delete missed and SP accumulated
        // stale PDFs on every run.)
        String plannedFileName = uniqueSpFilename(pdf.getFileName(), sourceId, newHash);

        // Stage A — insert the new local row FIRST. If everything else fails, the local hash
        // check on the next run will see this row and short-circuit (no SP churn).
        PermitAttachment newLocal;
        try {
            newLocal = new PermitAttachment();
            newLocal.setEntityType(SdsChemicalMapper.ENTITY_TYPE);
            newLocal.setEntityId(entity.getId());
            newLocal.setFileName(plannedFileName);
            newLocal.setContentType(pdf.getContentType() != null ? pdf.getContentType() : "application/pdf");
            newLocal.setAttachmentType("document");
            newLocal.setBase64Content(pdf.getBase64Content());
            newLocal.setContentHash(newHash);
            newLocal.setCreatedAt(LocalDateTime.now());
            newLocal.setOriginMachineId(syncConfig.getMachineId());
            newLocal.setOrigin(EBINDER_ORIGIN);
            newLocal.setDeleted(false);
            // Hub-run: mark as synced (hub IS the server, no re-upload loop). Non-hub: mark
            // unsynced so AttachmentSyncHandler ships it to the hub, then to peers.
            newLocal.setSyncedToServer(syncConfig.isHubMode());
            newLocal = attachmentRepo.save(newLocal);
        } catch (Exception e) {
            report.getErrors().add(new SdsSyncPdfsReportDto.ErrorEntry(
                sourceId, chemLabel, "LOCAL_INSERT", e.getMessage()));
            log.warn("[SDS Sync] LOCAL_INSERT failed for sourceId={}: {}", sourceId, e.getMessage());
            return;
        }

        // Stage B — add the new PDF to SharePoint. Add-then-delete means SP is continuously
        // populated during the swap (never a window where the PWA fallback sees nothing).
        if (hasSpId) {
            try {
                PaAttachmentDto spAtt = new PaAttachmentDto();
                spAtt.setFileName(plannedFileName);
                spAtt.setContentType(pdf.getContentType() != null ? pdf.getContentType() : "application/pdf");
                spAtt.setBase64Content(pdf.getBase64Content());
                spAdapter.addAttachment(spId, spAtt);
            } catch (Exception e) {
                if (isSpNotFound(e)) {
                    // SP row was hard-deleted at source. Tombstone the old scraper rows so peers
                    // don't accumulate duplicates; keep newLocal in place. Clear the dead SP id
                    // so the outbound SP-create sweep picks the chemical up and recreates the row
                    // (with the current local attachment set attached).
                    report.setSharepointRowMissing(report.getSharepointRowMissing() + 1);
                    report.getErrors().add(new SdsSyncPdfsReportDto.ErrorEntry(
                        sourceId, chemLabel, "SP_ADD",
                        "SharePoint row " + spId + " no longer exists — the outbound SP sweep will recreate it."));
                    tombstoneOldRows(oldScraperRows, sourceId, chemLabel, report);
                    entity.setSharepointId(null);
                    repo.save(entity);
                    report.setUpdated(report.getUpdated() + 1);
                    return;
                }
                // Non-404 Stage B failure (auth, throttle, quota, transient 500). Roll back the
                // Stage A insert so the next run's hash check does NOT short-circuit on our
                // orphaned local row — otherwise SP would stay stale forever with the report
                // lying about being "updated". Preserving retries beats optimistic bookkeeping.
                report.getErrors().add(new SdsSyncPdfsReportDto.ErrorEntry(
                    sourceId, chemLabel, "SP_ADD", e.getMessage()));
                log.warn("[SDS Sync] SP_ADD failed for sourceId={} spId={} — rolling back newLocal: {}",
                    sourceId, spId, e.getMessage());
                try { attachmentRepo.delete(newLocal); }
                catch (Exception rollbackEx) {
                    log.warn("[SDS Sync] rollback of newLocal (id={}) failed: {}", newLocal.getId(), rollbackEx.getMessage());
                }
                return;
            }
        } else {
            // No SP id — local-only update. Surface it in the report so ops can decide whether
            // to run the SP create sweep.
            report.setLocalOnlyNoSpId(report.getLocalOnlyNoSpId() + 1);
        }

        // Stage C — delete OLD SharePoint attachments. Only the ones matching one of the old
        // scraper-owned rows' filenames, so manual SP uploads are preserved. We compare by
        // filename since that's the identity SP tracks; the new attachment's filename differs
        // (via {@link #uniqueSpFilename}) so it isn't nuked.
        if (hasSpId) {
            for (PermitAttachment old : oldScraperRows) {
                String oldName = old.getFileName();
                if (oldName == null || oldName.isBlank()) continue;
                try {
                    spAdapter.deleteAllAttachmentsMatching(spId, oldName);
                } catch (Exception e) {
                    // Non-fatal — SP has both old and new; next run's hash check sees the new
                    // hash in local and short-circuits, so we don't churn, we just leave a
                    // stale SP file next to the fresh one. Flag it.
                    report.getErrors().add(new SdsSyncPdfsReportDto.ErrorEntry(
                        sourceId, chemLabel, "SP_DELETE_OLD",
                        "Failed to remove old SP attachment '" + oldName + "': " + e.getMessage()));
                    log.warn("[SDS Sync] SP_DELETE_OLD failed for sourceId={} spId={} file={}: {}",
                        sourceId, spId, oldName, e.getMessage());
                }
            }
        }

        // Stage D — tombstone the old local rows so the delete propagates to peers via
        // AttachmentSyncHandler.
        tombstoneOldRows(oldScraperRows, sourceId, chemLabel, report);

        report.setUpdated(report.getUpdated() + 1);
        log.debug("[SDS Sync] Reconciled sourceId={} chem='{}' newHash={} (decoded {} bytes)",
            sourceId, chemLabel, newHash, decodedLen);
    }

    /**
     * Tombstone every row in {@code oldRows} so the delete propagates to peers via the
     * attachment sync channel. Nulls {@code base64Content} first so multi-hundred-KB dead
     * payloads don't ride the tombstone upload — receivers only need identity fields to find
     * and delete their local copy. Per-row failures are logged into the report so the operator
     * can spot rows that need manual cleanup, but the loop always continues.
     */
    private void tombstoneOldRows(List<PermitAttachment> oldRows,
                                  String sourceId, String chemLabel, SdsSyncPdfsReportDto report) {
        for (PermitAttachment old : oldRows) {
            try {
                old.setDeleted(true);
                old.setBase64Content(null);          // dead payload — receivers don't need it
                old.setSyncedToServer(false);        // trigger tombstone re-upload
                old.setSyncedToMachines(null);       // reset trail so every peer picks it up
                attachmentRepo.save(old);
            } catch (Exception e) {
                report.getErrors().add(new SdsSyncPdfsReportDto.ErrorEntry(
                    sourceId, chemLabel, "LOCAL_TOMBSTONE",
                    "Failed to tombstone row id=" + old.getId() + ": " + e.getMessage()));
                log.warn("[SDS Sync] LOCAL_TOMBSTONE failed for row {}: {}", old.getId(), e.getMessage());
            }
        }
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────────────

    private boolean isScraperOwned(PermitAttachment att) {
        String o = att.getOrigin();
        // ebinder — rows this tool just wrote. sharepoint — rows pulled back from SP by
        // pullAllFromSharePoint (which might carry stale wrong PDFs from a pre-fix era); we
        // WANT Sync PDFs to be able to replace those.
        if (EBINDER_ORIGIN.equalsIgnoreCase(o) || "sharepoint".equalsIgnoreCase(o)) return true;
        // Legacy fallback for rows that predate the origin column. Two shapes are known-safe:
        //  (a) sds-{sourceId}.pdf — the historical scraper filename convention;
        //  (b) sds-{sourceId}-{hash8}.pdf — the newer uniqueSpFilename shape (Sync PDFs writes).
        // Both are internal scraper filenames and would never be produced by a manual upload.
        if (o == null && att.getFileName() != null && LEGACY_SCRAPER_FILENAME.matcher(att.getFileName()).matches()) {
            return true;
        }
        return false;
    }

    /** Give the new SP attachment a name distinct from any old ones so add-then-delete works. */
    private String uniqueSpFilename(String rawName, String sourceId, String hash) {
        String base;
        if (rawName != null && !rawName.isBlank()) {
            int dot = rawName.lastIndexOf('.');
            base = dot > 0 ? rawName.substring(0, dot) : rawName;
        } else {
            base = "sds-" + sourceId;
        }
        return base + "-" + hash.substring(0, 8) + ".pdf";
    }

    /** Best-effort recognition of "SP row was deleted at source". SP REST wraps 404s in a
     *  RuntimeException whose message contains "404" or "Not Found"; PA V2 wraps them in
     *  {@code PA-V2 ... failed} with the same substrings. */
    private boolean isSpNotFound(Exception e) {
        String msg = e.getMessage();
        if (msg == null) return false;
        String lower = msg.toLowerCase();
        return lower.contains("404") || lower.contains("not found") || lower.contains("does not exist");
    }

    private byte[] decodeBase64Strict(String base64) {
        // Normalize whitespace before decoding so CRLF/LF line breaks don't affect the hash.
        String cleaned = base64.replaceAll("\\s+", "");
        return Base64.getDecoder().decode(cleaned);
    }

    /** Structural validation beyond the magic-byte check: catches truncated downloads and
     *  error-page-mislabeled-as-PDF cases that would otherwise overwrite good copies. */
    private String validatePdf(byte[] bytes) {
        if (bytes == null || bytes.length < MIN_PDF_BYTES) {
            return "PDF too small (" + (bytes == null ? 0 : bytes.length) + " bytes, min " + MIN_PDF_BYTES + ")";
        }
        // %PDF- header
        if (!(bytes[0] == '%' && bytes[1] == 'P' && bytes[2] == 'D' && bytes[3] == 'F' && bytes[4] == '-')) {
            return "PDF magic header missing";
        }
        // %%EOF within the last 1KB — trailing marker that a genuinely complete PDF always carries.
        int tailStart = Math.max(0, bytes.length - 1024);
        String tail = new String(bytes, tailStart, bytes.length - tailStart, java.nio.charset.StandardCharsets.ISO_8859_1);
        if (!tail.contains("%%EOF")) {
            return "PDF %%EOF marker missing (truncated download?)";
        }
        return null;
    }

    private String sha256Hex(byte[] bytes) {
        try {
            byte[] hash = MessageDigest.getInstance("SHA-256").digest(bytes);
            StringBuilder sb = new StringBuilder(hash.length * 2);
            for (byte b : hash) sb.append(String.format("%02x", b));
            return sb.toString();
        } catch (Exception e) {
            return null;
        }
    }

    private String primaryName(SdsChemical c) {
        String n = SdsChemicalMapper.primaryName(c.getNames());
        return n != null && !n.isBlank() ? n : ("chemical#" + c.getId());
    }
}
