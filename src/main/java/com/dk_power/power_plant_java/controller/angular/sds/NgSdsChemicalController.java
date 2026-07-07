package com.dk_power.power_plant_java.controller.angular.sds;

import com.dk_power.power_plant_java.config.SyncConfig;
import com.dk_power.power_plant_java.controller.angular.NgApiResponse;
import com.dk_power.power_plant_java.dto.sds.SdsChemicalDto;
import com.dk_power.power_plant_java.dto.sds.SdsGapReportDto;
import com.dk_power.power_plant_java.dto.sds.SdsGapReportEmailDto;
import com.dk_power.power_plant_java.dto.sds.SdsGapReportEmailResultDto;
import com.dk_power.power_plant_java.dto.sds.SdsImportItemDto;
import com.dk_power.power_plant_java.dto.sds.SdsImportReportDto;
import com.dk_power.power_plant_java.dto.sds.SdsSeedReportDto;
import com.dk_power.power_plant_java.dto.sds.SdsSyncPdfsReportDto;
import com.dk_power.power_plant_java.dto.sds.SdsSyncReportDto;
import com.dk_power.power_plant_java.entities.permits.PermitAttachment;
import com.dk_power.power_plant_java.mappers.sds.SdsChemicalMapper;
import com.dk_power.power_plant_java.repository.permits.PermitAttachmentRepo;
import com.dk_power.power_plant_java.sevice.angular.sds.NgSdsChemicalService;
import com.dk_power.power_plant_java.sevice.angular.sds.SdsAddressService;
import com.dk_power.power_plant_java.sevice.angular.sds.SdsGapReportEmailService;
import com.dk_power.power_plant_java.sevice.angular.sds.SdsSeedService;
import com.dk_power.power_plant_java.sevice.angular.sds.SdsSyncPdfsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/ng/sds-chemicals")
@Slf4j
public class NgSdsChemicalController {

    private final NgSdsChemicalService service;
    private final SdsAddressService addressService;
    private final SdsSeedService seedService;
    private final SdsGapReportEmailService gapReportEmailService;
    private final SdsSyncPdfsService syncPdfsService;
    private final SyncConfig syncConfig;
    private final PermitAttachmentRepo attachmentRepo;

    /** Suggested filing address (latest book, next section) for a new chemical; user approves/edits. */
    @GetMapping("/suggest-address")
    public ResponseEntity<NgApiResponse<Map<String, Integer>>> suggestAddress() {
        try {
            SdsAddressService.Address a = addressService.suggestNextAddress();
            return ResponseEntity.ok(new NgApiResponse<>(
                    Map.of("bookNumber", a.bookNumber(), "sectionNumber", a.sectionNumber()), "Suggested address"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Failed: " + e.getMessage()));
        }
    }

    /** Scraper import: a full eBinder snapshot → upsert by sourceId + return the reconcile report. */
    @PostMapping("/import")
    public ResponseEntity<NgApiResponse<SdsImportReportDto>> importFromSource(@RequestBody List<SdsImportItemDto> items) {
        try {
            SdsImportReportDto report = service.importFromSource(items);
            return ResponseEntity.ok(new NgApiResponse<>(report,
                    report.getCreated() + " new, " + report.getUpdated() + " updated, "
                    + report.getMissingFromSource().size() + " missing from source"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Import failed: " + e.getMessage()));
        }
    }

    /** Reconcile-only: full sourceId set from a batched scrape → primary names missing from source. */
    @PostMapping("/source-reconcile")
    public ResponseEntity<NgApiResponse<List<String>>> sourceReconcile(@RequestBody List<String> sourceIds) {
        try {
            return ResponseEntity.ok(new NgApiResponse<>(service.reconcileMissing(sourceIds), "Reconcile complete"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Failed: " + e.getMessage()));
        }
    }

    /**
     * "Sync PDFs with eBinder" — walk-and-replace reconciliation of scraper-owned PDFs across
     * the local DB and SharePoint. Content-hash driven so re-runs on already-synced items are
     * no-ops; only touches attachments tagged {@code origin='ebinder'} (or the legacy filename
     * pattern) so manual uploads are preserved even on matched chemicals.
     * <p>
     * Body: {@code { "items": [...scraped batch...], "dryRun": bool, "isFirstBatch": bool,
     * "report": {previous report to accumulate into} }}. Batching is client-driven — the
     * Electron scraper pushes one item at a time so payloads stay under HTTP limits and the
     * per-chemical progress is granular.
     * <p>
     * <b>Gated on hub role.</b> Running Sync PDFs from a desktop would spawn a competing writer
     * against SharePoint and diverge the fleet — 403 if invoked anywhere else.
     */
    @PostMapping("/sync-pdfs")
    public ResponseEntity<NgApiResponse<SdsSyncPdfsReportDto>> syncPdfs(
            @RequestBody com.dk_power.power_plant_java.dto.sds.SdsSyncPdfsRequestDto req) {
        if (!syncConfig.isHubMode()) {
            return ResponseEntity.status(403).body(new NgApiResponse<>(null,
                "Sync PDFs must run on the hub — this instance is not configured as a hub."));
        }
        try {
            SdsSyncPdfsReportDto report = req.getReport() != null ? req.getReport() : new SdsSyncPdfsReportDto();
            report.setDryRun(req.isDryRun() || report.isDryRun());

            // Preflight runs once, on the first batch. If it flags blocking invariants the
            // blockers travel with the report on every subsequent batch and we refuse writes.
            if (req.isFirstBatch()) {
                syncPdfsService.runPreflight(report);
            }
            if (!report.getPreflightBlockers().isEmpty()) {
                return ResponseEntity.ok(new NgApiResponse<>(report,
                    "Preflight failed: " + String.join("; ", report.getPreflightBlockers())));
            }

            syncPdfsService.reconcileBatch(req.getItems(), req.isDryRun(), report);
            return ResponseEntity.ok(new NgApiResponse<>(report,
                (req.isDryRun() ? "Preview: " : "") + "checked " + report.getChemicalsChecked()
                + ", updated " + report.getUpdated()
                + ", already up-to-date " + report.getAlreadyUpToDate()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Sync PDFs failed: " + e.getMessage()));
        }
    }

    /**
     * Email the gap report to a recipient with PDFs of every missing-from-eBinder chemical
     * attached, so the recipient can upload them to the eBinder. Uses the scraped catalog from
     * the request (same data the gap report panel just rendered) so the email matches the UI.
     */
    @PostMapping("/email-gap-report")
    public ResponseEntity<NgApiResponse<SdsGapReportEmailResultDto>> emailGapReport(@RequestBody SdsGapReportEmailDto req) {
        try {
            boolean includeAttachments = req.getIncludeAttachments() == null || req.getIncludeAttachments();
            SdsGapReportEmailResultDto result = gapReportEmailService.emailGapReport(
                    req.getTo(), req.getCc(), req.getScrapedCatalog(), includeAttachments);
            return ResponseEntity.ok(new NgApiResponse<>(result,
                    result.isSent() ? result.getMessage() : "Email not sent: " + result.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Email failed: " + e.getMessage()));
        }
    }

    /** Admin one-shot seed: load the curated book↔eBinder match map into the DB (metadata only, no PDFs). */
    @PostMapping("/seed")
    public ResponseEntity<NgApiResponse<SdsSeedReportDto>> seed() {
        try {
            SdsSeedReportDto report = seedService.seed();
            return ResponseEntity.ok(new NgApiResponse<>(report,
                    report.getCreated() + " created, " + report.getUpdated() + " updated ("
                    + report.getMatchedSlots() + " matched + " + report.getBookOnlyCount() + " book-only)"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Seed failed: " + e.getMessage()));
        }
    }

    /**
     * Gaps after seeding, against a FRESH eBinder list scraped by the Electron manager (so it can't go
     * stale): website chemicals not yet in the DB + DB chemicals with no SDS PDF. Falls back to the
     * bundled catalog if the posted list is empty.
     */
    @PostMapping("/gap-report")
    public ResponseEntity<NgApiResponse<SdsGapReportDto>> gapReport(@RequestBody(required = false) List<SdsImportItemDto> scrapedCatalog) {
        try {
            SdsGapReportDto report = seedService.gapReport(scrapedCatalog);
            return ResponseEntity.ok(new NgApiResponse<>(report,
                    report.getMissingFromDb().size() + " missing from DB, "
                    + report.getMissingPdf().size() + " missing PDFs"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Gap report failed: " + e.getMessage()));
        }
    }

    /** Admin: push every local chemical + its attachments to SharePoint (create-or-update). */
    @PostMapping("/push-all-to-sp")
    public ResponseEntity<NgApiResponse<SdsSyncReportDto>> pushAllToSharePoint() {
        try {
            SdsSyncReportDto r = service.pushAllToSharePoint();
            return ResponseEntity.ok(new NgApiResponse<>(r,
                    r.getChemicalsCreated() + " created, " + r.getChemicalsUpdated() + " updated, "
                    + r.getAttachmentsAdded() + " attachments pushed (" + r.getErrors().size() + " errors)"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Push failed: " + e.getMessage()));
        }
    }

    /**
     * Admin: pull every chemical (and its attachments) from SharePoint and replace local state.
     * Goes through {@code repo.save()} so field-level sync events fire — the hub propagates the
     * upsert to every other client (just like seeding). Attachments are saved unsynced so the
     * AttachmentSyncHandler relays them through the hub to other clients.
     */
    @PostMapping("/pull-all-from-sp")
    public ResponseEntity<NgApiResponse<SdsSyncReportDto>> pullAllFromSharePoint() {
        try {
            SdsSyncReportDto r = service.pullAllFromSharePoint();
            return ResponseEntity.ok(new NgApiResponse<>(r,
                    r.getChemicalsCreated() + " created, " + r.getChemicalsUpdated() + " updated, "
                    + r.getAttachmentsAdded() + " attachments pulled — hub will propagate to other clients ("
                    + r.getErrors().size() + " errors)"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Pull failed: " + e.getMessage()));
        }
    }

    /**
     * Admin: soft-delete every local SDS chemical. The save fires field-level sync events for
     * each row — the hub broadcasts the delete to every other client and queues SharePoint
     * cleanup via {@code SdsOutboundSharePointSync}. Mirrors how seeding propagates, just
     * in reverse.
     */
    @PostMapping("/clear-all")
    public ResponseEntity<NgApiResponse<SdsSyncReportDto>> clearAll() {
        try {
            SdsSyncReportDto r = service.clearAll();
            return ResponseEntity.ok(new NgApiResponse<>(r,
                    r.getChemicalsDeleted() + " chemicals soft-deleted + " + r.getAttachmentsRemoved()
                    + " attachments removed — hub will propagate to other clients + SharePoint"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Clear failed: " + e.getMessage()));
        }
    }

    /** Admin/test: drop every local PDF attachment so the next scrape re-downloads them fresh. */
    @PostMapping("/clear-pdfs")
    public ResponseEntity<NgApiResponse<Integer>> clearPdfs() {
        try {
            int n = service.clearAllPdfs();
            return ResponseEntity.ok(new NgApiResponse<>(n, n + " PDF attachments deleted (local only)"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Clear PDFs failed: " + e.getMessage()));
        }
    }

    /** Admin bulk dump: one Incoming chemical per uploaded PDF (no metadata yet). */
    @PostMapping("/dump")
    public ResponseEntity<NgApiResponse<Integer>> dumpIncoming(@RequestBody List<Map<String, String>> files) {
        try {
            int created = service.dumpIncoming(files);
            return ResponseEntity.ok(new NgApiResponse<>(created, created + " incoming SDS document(s) created"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Failed: " + e.getMessage()));
        }
    }

    @GetMapping("/get-all")
    public ResponseEntity<NgApiResponse<List<SdsChemicalDto>>> getAll() {
        try {
            return ResponseEntity.ok(new NgApiResponse<>(service.getAll(), "Successfully retrieved all SDS chemicals"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Failed: " + e.getMessage()));
        }
    }

    @GetMapping("/active")
    public ResponseEntity<NgApiResponse<List<SdsChemicalDto>>> getActive() {
        try {
            return ResponseEntity.ok(new NgApiResponse<>(service.getActive(), "Active SDS chemicals retrieved"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Failed: " + e.getMessage()));
        }
    }

    @GetMapping("/by-status/{status}")
    public ResponseEntity<NgApiResponse<List<SdsChemicalDto>>> getByStatus(@PathVariable String status) {
        try {
            return ResponseEntity.ok(new NgApiResponse<>(service.getByStatus(status), "Retrieved chemicals with status: " + status));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Failed: " + e.getMessage()));
        }
    }

    @GetMapping("/unprocessed")
    public ResponseEntity<NgApiResponse<List<SdsChemicalDto>>> getUnprocessed() {
        try {
            return ResponseEntity.ok(new NgApiResponse<>(service.getUnprocessed(), "Unprocessed SDS chemicals retrieved"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Failed: " + e.getMessage()));
        }
    }

    @GetMapping("/get-by-id/{id}")
    public ResponseEntity<NgApiResponse<SdsChemicalDto>> getById(@PathVariable Long id) {
        try {
            SdsChemicalDto dto = service.getDtoById(id);
            if (dto == null) return ResponseEntity.notFound().build();
            return ResponseEntity.ok(new NgApiResponse<>(dto, "Found"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Failed: " + e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<NgApiResponse<SdsChemicalDto>> create(@RequestBody SdsChemicalDto dto) {
        try {
            return ResponseEntity.ok(new NgApiResponse<>(service.save(dto), "SDS chemical created"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Failed: " + e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<NgApiResponse<SdsChemicalDto>> update(@PathVariable Long id, @RequestBody SdsChemicalDto dto) {
        try {
            dto.setId(id);
            return ResponseEntity.ok(new NgApiResponse<>(service.save(dto), "SDS chemical updated"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Failed: " + e.getMessage()));
        }
    }

    /**
     * Bind a book-only chemical (synthetic BOOK-N-S sourceId) to a real eBinder Document ID, OR
     * move a removed-from-eBinder chemical to a new Document ID. Updates the row in place — same
     * DB id, same Book/Section, names optionally merged. The next close-gaps scrape attaches the
     * PDF for the new sourceId.
     */
    @PostMapping("/{id}/match")
    public ResponseEntity<NgApiResponse<SdsChemicalDto>> matchToSource(
            @PathVariable Long id, @RequestBody Map<String, String> body) {
        try {
            String newSourceId = body.get("sourceItemId");
            if (newSourceId == null || newSourceId.isBlank()) {
                return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "sourceItemId is required"));
            }
            return ResponseEntity.ok(new NgApiResponse<>(
                    service.matchToSource(id, newSourceId, body.get("names")), "Matched"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Match failed: " + e.getMessage()));
        }
    }

    @PostMapping("/{id}/change-status/{status}")
    public ResponseEntity<NgApiResponse<SdsChemicalDto>> changeStatus(
            @PathVariable Long id, @PathVariable String status) {
        try {
            return ResponseEntity.ok(new NgApiResponse<>(service.changeStatus(id, status), "Status changed to " + status));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Failed: " + e.getMessage()));
        }
    }

    @GetMapping("/{id}/attachments")
    public ResponseEntity<NgApiResponse<List<PermitAttachment>>> getAttachments(@PathVariable Long id) {
        try {
            // Filter tombstones — Sync PDFs marks superseded rows deleted=true so the tombstone
            // propagates over the attachment sync channel; those rows linger until the purge
            // sweep runs, but MUST NOT surface in the UI.
            return ResponseEntity.ok(new NgApiResponse<>(
                    attachmentRepo.findByEntityTypeAndEntityIdAndDeletedFalse(SdsChemicalMapper.ENTITY_TYPE, id),
                    "Attachments retrieved"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Failed: " + e.getMessage()));
        }
    }

    @PostMapping("/{id}/attachments")
    public ResponseEntity<NgApiResponse<PermitAttachment>> uploadAttachment(
            @PathVariable Long id, @RequestBody Map<String, String> body) {
        try {
            PermitAttachment att = service.uploadAttachment(id,
                    body.get("fileName"), body.get("contentType"), body.get("base64Content"));
            return ResponseEntity.ok(new NgApiResponse<>(att, "Attachment uploaded"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Failed: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{id}/attachments/{attachmentId}")
    public ResponseEntity<NgApiResponse<Void>> deleteAttachment(
            @PathVariable Long id, @PathVariable Long attachmentId) {
        try {
            service.deleteAttachment(id, attachmentId);
            return ResponseEntity.ok(new NgApiResponse<>(null, "Attachment deleted"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Failed: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<NgApiResponse<Void>> delete(@PathVariable Long id) {
        try {
            service.softDelete(id);
            return ResponseEntity.ok(new NgApiResponse<>(null, "SDS chemical deleted"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Failed: " + e.getMessage()));
        }
    }
}
