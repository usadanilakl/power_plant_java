package com.dk_power.power_plant_java.controller.angular;

import com.dk_power.power_plant_java.config.security.RestrictedAllowed;
import com.dk_power.power_plant_java.dto.maximo.CompleteWorkOrderRequest;
import com.dk_power.power_plant_java.dto.maximo.CreateMaximoServiceRequestDto;
import com.dk_power.power_plant_java.dto.maximo.MaximoInventoryItemDto;
import com.dk_power.power_plant_java.dto.maximo.MaximoInventoryStockDto;
import com.dk_power.power_plant_java.dto.maximo.MaximoInventoryUsageDto;
import com.dk_power.power_plant_java.dto.maximo.MaximoLocationDto;
import com.dk_power.power_plant_java.dto.maximo.MaximoOverviewDto;
import com.dk_power.power_plant_java.dto.maximo.IssueMaterialRequest;
import com.dk_power.power_plant_java.dto.maximo.MaximoMaterialTxnDto;
import com.dk_power.power_plant_java.dto.maximo.ReturnMaterialRequest;
import com.dk_power.power_plant_java.dto.maximo.PartsCheckoutRequest;
import com.dk_power.power_plant_java.dto.maximo.PartsCheckoutResult;
import com.dk_power.power_plant_java.dto.maximo.PmAssignRequest;
import com.dk_power.power_plant_java.dto.maximo.PmLeadDto;
import com.dk_power.power_plant_java.dto.maximo.PmOccurrenceDto;
import com.dk_power.power_plant_java.dto.maximo.PmPendingAssignmentDto;
import com.dk_power.power_plant_java.dto.maximo.MaximoTicketAssetDto;
import com.dk_power.power_plant_java.dto.maximo.RecurringPmDto;
import com.dk_power.power_plant_java.sevice.maximo.MaximoTicketIndexService;
import com.dk_power.power_plant_java.entities.maximo.RecurrenceCadence;
import com.dk_power.power_plant_java.entities.maximo.ShiftPreference;
import com.dk_power.power_plant_java.sevice.maximo.MaximoInventoryAdapter;
import com.dk_power.power_plant_java.sevice.maximo.MaximoInventoryCatalogService;
import com.dk_power.power_plant_java.sevice.maximo.MaximoLocationAdapter;
import com.dk_power.power_plant_java.sevice.maximo.MaximoPartsCheckoutService;
import com.dk_power.power_plant_java.sevice.maximo.PmAssignmentService;
import com.dk_power.power_plant_java.sevice.maximo.RecurringPmService;
import com.dk_power.power_plant_java.dto.maximo.MaximoAssetDto;
import com.dk_power.power_plant_java.dto.maximo.MaximoDoclinkDto;
import com.dk_power.power_plant_java.dto.maximo.MaximoServiceRequestCriteria;
import com.dk_power.power_plant_java.dto.maximo.MaximoServiceRequestDto;
import com.dk_power.power_plant_java.dto.maximo.MaximoWorkOrderCriteria;
import com.dk_power.power_plant_java.dto.maximo.MaximoWorkOrderDto;
import com.dk_power.power_plant_java.dto.maximo.MaximoWorklogDto;
import com.dk_power.power_plant_java.sevice.maximo.MaximoAssetAdapter;
import com.dk_power.power_plant_java.sevice.maximo.MaximoDoclinksAdapter;
import com.dk_power.power_plant_java.sevice.maximo.MaximoBundleService;
import com.dk_power.power_plant_java.sevice.maximo.MaximoServiceRequestAdapter;
import com.dk_power.power_plant_java.sevice.maximo.MaximoWorkOrderAdapter;
import com.dk_power.power_plant_java.sevice.maximo.MaximoWorklogAdapter;
import com.dk_power.power_plant_java.entities.physical.PhysicalObject;
import com.dk_power.power_plant_java.repository.physical.PhysicalObjectRepo;
import com.dk_power.power_plant_java.sevice.physical.PhysicalObjectMaximoSeeder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

/**
 * Angular-facing endpoints for Maximo integration.
 * Bean only registers when maximo.api-key is configured (mirrors MaximoConfig gating).
 *
 * Flow this enables:
 *   1. user picks an Equipment locally → call /assets?tag=... to find matching Maximo assetnum
 *   2. /assets/{assetnum}/service-requests + /assets/{assetnum}/work-orders → show history
 *   3. POST /service-requests → submit a new SR
 *   4. POST /service-requests/{href}/attachments → attach P&ID / picture / doc
 */
@Slf4j
@RestController
@RequestMapping("/ng/maximo")
@RequiredArgsConstructor
@RestrictedAllowed  // access is gated on ROLE_PLANT/ROLE_ADMIN (SecurityConfig); no separate FULL grant required
// Active on any Maximo-configured node EXCEPT a kiosk. A kiosk runs the SAME shared jar, so maximo.api-key is
// still baked in — but selecting the hub source routes the overview through HubKioskMaximoClient
// serve /bundle/overview via the hub proxy instead (no path collision; the baked-in api-key is simply unused).
// Overview moved to MaximoOverviewController, which is always present and picks its source per
// request — so this no longer has to be disabled for a kiosk to avoid a duplicate mapping.
@ConditionalOnExpression("'${maximo.api-key:}'.length() > 0")
public class NgMaximoController {

    private final MaximoAssetAdapter assets;
    private final MaximoServiceRequestAdapter serviceRequests;
    private final MaximoWorkOrderAdapter workOrders;
    private final MaximoDoclinksAdapter doclinks;
    private final MaximoWorklogAdapter worklog;
    private final MaximoBundleService bundles;
    private final MaximoLocationAdapter locations;
    private final MaximoInventoryAdapter inventory;
    private final MaximoInventoryCatalogService inventoryCatalog;
    private final MaximoPartsCheckoutService partsCheckout;
    private final RecurringPmService recurringPms;
    private final PmAssignmentService pmAssignments;
    private final MaximoTicketIndexService ticketIndex;
    private final com.dk_power.power_plant_java.repository.users.UserRepo userRepo;
    private final PhysicalObjectMaximoSeeder physicalObjectSeeder;
    private final PhysicalObjectRepo physicalObjects;

    /** Work-type options. The MXDOMAIN OS isn't API-authorized, so these mirror the values in use at JG. */
    private static final List<Map<String, String>> WORK_TYPES = List.of(
            Map.of("value", "CM", "label", "CM — Corrective Maintenance"),
            Map.of("value", "PM", "label", "PM — Preventive Maintenance"),
            Map.of("value", "WAR", "label", "WAR — Warranty"),
            Map.of("value", "REG", "label", "REG — Regulatory"));

    // ---- Assets -----------------------------------------------------------

    @GetMapping("/assets")
    public ResponseEntity<NgApiResponse<List<MaximoAssetDto>>> searchAssets(
            @RequestParam(value = "tag", required = false) String tag,
            @RequestParam(value = "siteid", required = false) String siteid,
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "location", required = false) String location,
            @RequestParam(value = "pageSize", defaultValue = "25") int pageSize) {
        List<MaximoAssetDto> result = assets.search(tag, siteid, status, location, pageSize);
        return ResponseEntity.ok(new NgApiResponse<>(result, "ok"));
    }

    @GetMapping("/assets/{assetnum}")
    public ResponseEntity<NgApiResponse<MaximoAssetDto>> getAsset(@PathVariable String assetnum) {
        return assets.findByAssetnum(assetnum)
                .map(a -> ResponseEntity.ok(new NgApiResponse<>(a, "ok")))
                .orElseGet(() -> ResponseEntity.ok(new NgApiResponse<>(null, "not found")));
    }

    // ---- Service Requests -------------------------------------------------

    @GetMapping("/assets/{assetnum}/service-requests")
    public ResponseEntity<NgApiResponse<List<MaximoServiceRequestDto>>> srForAsset(
            @PathVariable String assetnum,
            @RequestParam(value = "pageSize", defaultValue = "50") int pageSize) {
        return ResponseEntity.ok(new NgApiResponse<>(
                serviceRequests.listForAsset(assetnum, pageSize), "ok"));
    }

    @GetMapping("/service-requests")
    public ResponseEntity<NgApiResponse<List<MaximoServiceRequestDto>>> srByCriteria(
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "assetnum", required = false) String assetnum,
            @RequestParam(value = "location", required = false) String location,
            @RequestParam(value = "priority", required = false) String priority,
            @RequestParam(value = "reportedby", required = false) String reportedby,
            @RequestParam(value = "affectedperson", required = false) String affectedperson,
            @RequestParam(value = "classstructureid", required = false) String classstructureid,
            @RequestParam(value = "reportdateFrom", required = false) String reportdateFrom,
            @RequestParam(value = "reportdateTo", required = false) String reportdateTo,
            @RequestParam(value = "textContains", required = false) String textContains,
            @RequestParam(value = "descriptionContains", required = false) String descriptionContains,
            @RequestParam(value = "longDescriptionContains", required = false) String longDescriptionContains,
            @RequestParam(value = "siteid", required = false) String siteid,
            @RequestParam(value = "pageSize", defaultValue = "50") int pageSize) {
        MaximoServiceRequestCriteria c = new MaximoServiceRequestCriteria();
        c.setTextContains(textContains);
        c.setStatus(status);
        c.setAssetnum(assetnum);
        c.setLocation(location);
        c.setPriority(priority);
        c.setReportedby(reportedby);
        c.setAffectedperson(affectedperson);
        c.setClassstructureid(classstructureid);
        c.setReportdateFrom(reportdateFrom);
        c.setReportdateTo(reportdateTo);
        c.setDescriptionContains(descriptionContains);
        c.setLongDescriptionContains(longDescriptionContains);
        c.setSiteid(siteid);
        // No filters = the page just opened. Show the newest SRs rather than an empty table.
        return ResponseEntity.ok(new NgApiResponse<>(
                c.hasAnyFilter() ? serviceRequests.listByCriteria(c, pageSize)
                                 : serviceRequests.listLatest(siteid, pageSize), "ok"));
    }

    @PostMapping("/service-requests")
    public ResponseEntity<NgApiResponse<MaximoServiceRequestDto>> createSr(
            @RequestBody CreateMaximoServiceRequestDto body) {
        // Record WHO submitted: default reportedby to the signed-in desktop user (backend-derived,
        // not trusting the client). A client-supplied value (submitting on someone's behalf) wins.
        if (body.getReportedby() == null || body.getReportedby().isBlank()) {
            body.setReportedby(currentUserPersonid());
        }
        MaximoServiceRequestDto created = serviceRequests.create(body);
        return ResponseEntity.ok(new NgApiResponse<>(created, "created"));
    }

    @GetMapping("/service-requests/{href}")
    public ResponseEntity<NgApiResponse<MaximoServiceRequestDto>> getSr(@PathVariable String href) {
        return serviceRequests.findByHref(href)
                .map(sr -> ResponseEntity.ok(new NgApiResponse<>(sr, "ok")))
                .orElseGet(() -> ResponseEntity.ok(new NgApiResponse<>(null, "not found")));
    }

    /** SR statuses where the ticket is still editable (description/notes/attachments). */
    private static final java.util.Set<String> EDITABLE_SR_STATUSES =
            java.util.Set.of("NEW", "QUEUED", "INPROG", "PENDING");

    /** Edit an editable SR's description / long description. Rejected (and Maximo's error surfaced) otherwise. */
    @PatchMapping("/service-requests/{href}")
    public ResponseEntity<NgApiResponse<MaximoServiceRequestDto>> updateSr(
            @PathVariable String href, @RequestBody UpdateSrRequest body) {
        try {
            MaximoServiceRequestDto current = serviceRequests.findByHref(href).orElse(null);
            if (current == null) return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "SR not found"));
            if (!isEditableSr(current.getStatus())) {
                return ResponseEntity.badRequest().body(
                        new NgApiResponse<>(null, "SR is not editable in status " + current.getStatus()));
            }
            java.util.Map<String, String> fields = new java.util.LinkedHashMap<>();
            fields.put("spi:description", body.description());
            fields.put("spi:description_longdescription", body.longDescription());
            fields.put("spi:reportedpriority", body.priority());
            fields.put("spi:reportedby", body.reportedby());
            fields.put("spi:assetnum", body.assetnum());
            fields.put("spi:location", body.location());
            fields.put("spi:classstructureid", body.classstructureid());
            fields.put("spi:affectedperson", body.affectedperson());
            MaximoServiceRequestDto updated = serviceRequests.updateFields(href, fields);
            return ResponseEntity.ok(new NgApiResponse<>(updated, "updated"));
        } catch (Exception e) {
            log.warn("[Maximo] update SR {} failed: {}", href, e.getMessage());
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    /** Add a note (worklog) to an editable SR. Returns the refreshed note list. */
    @PostMapping("/service-requests/{href}/worklog")
    public ResponseEntity<NgApiResponse<List<MaximoWorklogDto>>> addSrWorklog(
            @PathVariable String href, @RequestBody com.dk_power.power_plant_java.dto.maximo.AddWorklogRequest req) {
        try {
            MaximoServiceRequestDto current = serviceRequests.findByHref(href).orElse(null);
            if (current != null && !isEditableSr(current.getStatus())) {
                return ResponseEntity.badRequest().body(
                        new NgApiResponse<>(null, "SR is not editable in status " + current.getStatus()));
            }
            serviceRequests.addWorklog(href, req.getSummary(), req.getDetails(), req.getLogtype());
            return ResponseEntity.ok(new NgApiResponse<>(worklog.listForSr(href), "added"));
        } catch (Exception e) {
            log.warn("[Maximo] add SR worklog on {} failed: {}", href, e.getMessage());
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    private static boolean isEditableSr(String status) {
        return status != null && EDITABLE_SR_STATUSES.contains(status.trim().toUpperCase());
    }

    /** Body for {@link #updateSr}: the SR fields a user can edit post-submit (blank = leave unchanged). */
    public record UpdateSrRequest(String description, String longDescription, String priority,
            String reportedby, String assetnum, String location, String classstructureid, String affectedperson) {}

    // ---- Work Orders ------------------------------------------------------

    @GetMapping("/assets/{assetnum}/work-orders")
    public ResponseEntity<NgApiResponse<List<MaximoWorkOrderDto>>> woForAsset(
            @PathVariable String assetnum,
            @RequestParam(value = "pageSize", defaultValue = "50") int pageSize) {
        return ResponseEntity.ok(new NgApiResponse<>(
                workOrders.listForAsset(assetnum, pageSize), "ok"));
    }

    @GetMapping("/work-orders")
    public ResponseEntity<NgApiResponse<List<MaximoWorkOrderDto>>> woByCriteria(
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "worktype", required = false) String worktype,
            @RequestParam(value = "assetnum", required = false) String assetnum,
            @RequestParam(value = "location", required = false) String location,
            @RequestParam(value = "priority", required = false) String priority,
            @RequestParam(value = "leadCraft", required = false) String leadCraft,
            @RequestParam(value = "supervisor", required = false) String supervisor,
            @RequestParam(value = "schedstartFrom", required = false) String schedstartFrom,
            @RequestParam(value = "schedfinishTo", required = false) String schedfinishTo,
            @RequestParam(value = "reportdateFrom", required = false) String reportdateFrom,
            @RequestParam(value = "reportdateTo", required = false) String reportdateTo,
            @RequestParam(value = "textContains", required = false) String textContains,
            @RequestParam(value = "descriptionContains", required = false) String descriptionContains,
            @RequestParam(value = "longDescriptionContains", required = false) String longDescriptionContains,
            @RequestParam(value = "wonumContains", required = false) String wonumContains,
            @RequestParam(value = "siteid", required = false) String siteid,
            @RequestParam(value = "pageSize", defaultValue = "50") int pageSize) {
        MaximoWorkOrderCriteria c = new MaximoWorkOrderCriteria();
        c.setTextContains(textContains);
        c.setStatus(status);
        c.setWorktype(worktype);
        c.setAssetnum(assetnum);
        c.setLocation(location);
        c.setPriority(priority);
        c.setLeadCraft(leadCraft);
        c.setSupervisor(supervisor);
        c.setSchedstartFrom(schedstartFrom);
        c.setSchedfinishTo(schedfinishTo);
        c.setReportdateFrom(reportdateFrom);
        c.setReportdateTo(reportdateTo);
        c.setDescriptionContains(descriptionContains);
        c.setLongDescriptionContains(longDescriptionContains);
        c.setWonumContains(wonumContains);
        c.setSiteid(siteid);
        // No filters = the page just opened. Show the newest WOs rather than an empty table.
        return ResponseEntity.ok(new NgApiResponse<>(
                c.hasAnyFilter() ? workOrders.listByCriteria(c, pageSize)
                                 : workOrders.listLatest(siteid, pageSize), "ok"));
    }

    @GetMapping("/work-orders/{href}")
    public ResponseEntity<NgApiResponse<MaximoWorkOrderDto>> getWo(@PathVariable String href) {
        return workOrders.findByHref(href)
                .map(wo -> ResponseEntity.ok(new NgApiResponse<>(wo, "ok")))
                .orElseGet(() -> ResponseEntity.ok(new NgApiResponse<>(null, "not found")));
    }

    /**
     * Complete a work order: record actual labor + a worklog note, then change status (default COMP).
     * Mirrors the manual Maximo flow (Labor → Log → Complete). A labor row with a blank laborcode
     * defaults to the signed-in user's Maximo personid (see {@code User.getMaximoPersonid()}).
     */
    @PostMapping("/work-orders/{href}/complete")
    public ResponseEntity<NgApiResponse<MaximoWorkOrderDto>> completeWorkOrder(
            @PathVariable String href, @RequestBody CompleteWorkOrderRequest req) {
        try {
            if (req.getLabor() != null) {
                String me = currentUserPersonid();
                for (CompleteWorkOrderRequest.LaborEntry e : req.getLabor()) {
                    if (e != null && (e.getLaborcode() == null || e.getLaborcode().isBlank())) {
                        e.setLaborcode(me);
                    }
                }
            }
            return workOrders.completeWorkOrder(href, req)
                    .map(wo -> ResponseEntity.ok(new NgApiResponse<>(wo, "completed")))
                    .orElseGet(() -> ResponseEntity.ok(new NgApiResponse<>(null, "completed")));
        } catch (Exception e) {
            log.warn("[Maximo] complete WO {} failed: {}", href, e.getMessage());
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    /**
     * The internal TASKS of a work order (child WO rows with {@code istask=1}), for the WO dialog's Tasks
     * tab. {@code parentWonum} is the parent WO's number (not its href). Each task is a full work order with
     * its own href/status, so it is completed via the existing {@code /work-orders/{href}/complete} endpoint.
     */
    @GetMapping("/work-orders/{parentWonum}/tasks")
    public ResponseEntity<NgApiResponse<List<MaximoWorkOrderDto>>> listWoTasks(@PathVariable String parentWonum) {
        try {
            return ResponseEntity.ok(new NgApiResponse<>(workOrders.listTasks(parentWonum), "ok"));
        } catch (Exception e) {
            log.warn("[Maximo] list tasks for WO {} failed: {}", parentWonum, e.getMessage());
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    /**
     * Transfer a work order's lead to another person: writes {@code spi:lead} (any Maximo personid) and adds
     * an audit worklog note. Does NOT change the WO status. Returns the refreshed WO. Mirrors the sibling
     * work-order endpoints' {@code @PathVariable} href handling (encoded client-side with encodeURIComponent).
     */
    @PostMapping("/work-orders/{href}/lead")
    public ResponseEntity<NgApiResponse<MaximoWorkOrderDto>> transferLead(
            @PathVariable String href, @RequestBody LeadTransferRequest req) {
        try {
            if (req == null || req.personid() == null || req.personid().isBlank()) {
                return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "personid is required"));
            }
            MaximoWorkOrderDto updated = pmAssignments.transferLead(href, req.personid(), req.memo());
            return ResponseEntity.ok(new NgApiResponse<>(updated, "lead transferred"));
        } catch (Exception e) {
            log.warn("[Maximo] transfer lead on {} failed: {}", href, e.getMessage());
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    /** Body for {@link #transferLead}: the new lead's Maximo personid and an optional audit memo. */
    public record LeadTransferRequest(String personid, String memo) {}

    /**
     * Reschedule a work order: set its Target Start (and optional Target Finish) in one MERGE. Dates are
     * {@code yyyy-MM-dd}; a blank/absent finish defaults to the start, and finish is clamped to ≥ start so
     * Maximo can't collapse the window. Returns the refreshed WO. Intended for approved/open WOs — Maximo
     * itself rejects the write in statuses that don't allow it.
     */
    @PostMapping("/work-orders/{href}/target-dates")
    public ResponseEntity<NgApiResponse<MaximoWorkOrderDto>> setTargetDates(
            @PathVariable String href, @RequestBody TargetDatesRequest req) {
        try {
            if (req == null || req.targetStart() == null || req.targetStart().isBlank()) {
                return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "targetStart is required"));
            }
            java.time.LocalDate start = java.time.LocalDate.parse(req.targetStart().trim());
            java.time.LocalDate finish = (req.targetFinish() != null && !req.targetFinish().isBlank())
                    ? java.time.LocalDate.parse(req.targetFinish().trim()) : start;
            workOrders.setTargetWindow(href, start, finish);
            MaximoWorkOrderDto updated = workOrders.findByHref(href).orElse(null);
            return ResponseEntity.ok(new NgApiResponse<>(updated, "rescheduled"));
        } catch (java.time.format.DateTimeParseException e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Dates must be yyyy-MM-dd"));
        } catch (Exception e) {
            log.warn("[Maximo] reschedule {} failed: {}", href, e.getMessage());
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    /** Body for {@link #setTargetDates}: ISO {@code yyyy-MM-dd} start and optional finish. */
    public record TargetDatesRequest(String targetStart, String targetFinish) {}

    /**
     * Add a worklog note to a work order (no labor, no status change). Handy for adding a log to an
     * already-completed WO. Returns the refreshed worklog list.
     */
    @PostMapping("/work-orders/{href}/worklog")
    public ResponseEntity<NgApiResponse<List<MaximoWorklogDto>>> addWoWorklog(
            @PathVariable String href, @RequestBody com.dk_power.power_plant_java.dto.maximo.AddWorklogRequest req) {
        try {
            workOrders.reportActuals(href, null, req.getSummary(), req.getDetails(), req.getLogtype());
            return ResponseEntity.ok(new NgApiResponse<>(worklog.listForWo(href), "added"));
        } catch (Exception e) {
            log.warn("[Maximo] add worklog on {} failed: {}", href, e.getMessage());
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    // ── Outage items (planned / short-notice-outage WOs + LOTO isolation notes) ──────────────
    private static final List<String> OUTAGE_TYPES = List.of("PLAN", "SNOW");

    /** Work orders flagged as outage work (Outage Type = PLAN or SNOW), newest first. */
    @GetMapping("/work-orders/outage")
    public ResponseEntity<NgApiResponse<List<MaximoWorkOrderDto>>> outageWorkOrders(
            @RequestParam(value = "siteid", required = false) String siteid,
            @RequestParam(value = "pageSize", defaultValue = "300") int pageSize) {
        try {
            return ResponseEntity.ok(new NgApiResponse<>(
                    workOrders.listByOutageType(OUTAGE_TYPES, siteid, pageSize), "ok"));
        } catch (Exception e) {
            // Return an error STATUS (not 200+empty) so the UI can distinguish a load failure — e.g. Maximo
            // unreachable — from a genuinely empty result, and say "failed to load" instead of "no items".
            log.warn("[Maximo] outage WO list failed: {}", e.getMessage());
            return ResponseEntity.status(502).body(new NgApiResponse<>(null, "Failed: " + e.getMessage()));
        }
    }

    /** A WO's LOTO isolation notes only (worklog rows tagged with the LOTO marker), newest first. */
    @GetMapping("/work-orders/{href}/loto-notes")
    public ResponseEntity<NgApiResponse<List<MaximoWorklogDto>>> lotoNotes(@PathVariable String href) {
        try {
            List<MaximoWorklogDto> notes = worklog.listForWo(href).stream()
                    .filter(MaximoWorkOrderAdapter::isLotoNote).toList();
            return ResponseEntity.ok(new NgApiResponse<>(notes, "ok"));
        } catch (Exception e) {
            log.warn("[Maximo] loto-notes on {} failed: {}", href, e.getMessage());
            return ResponseEntity.ok(new NgApiResponse<>(List.of(), "Failed: " + e.getMessage()));
        }
    }

    /** Add a LOTO isolation note to a WO. Returns the refreshed LOTO-notes list. */
    @PostMapping("/work-orders/{href}/loto-note")
    public ResponseEntity<NgApiResponse<List<MaximoWorklogDto>>> addLotoNote(
            @PathVariable String href, @RequestBody LotoNoteRequest req) {
        try {
            if (req == null || req.text() == null || req.text().isBlank())
                return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "note text is required"));
            workOrders.addLotoNote(href, req.text().trim());
            List<MaximoWorklogDto> notes = worklog.listForWo(href).stream()
                    .filter(MaximoWorkOrderAdapter::isLotoNote).toList();
            return ResponseEntity.ok(new NgApiResponse<>(notes, "added"));
        } catch (Exception e) {
            log.warn("[Maximo] add loto-note on {} failed: {}", href, e.getMessage());
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    public record LotoNoteRequest(String text) {}

    // ---- Work-order materials (issue list + return/correction) -----------

    @GetMapping("/work-orders/{href}/materials")
    public ResponseEntity<NgApiResponse<List<MaximoMaterialTxnDto>>> listWoMaterials(@PathVariable String href) {
        return ResponseEntity.ok(new NgApiResponse<>(workOrders.listMaterials(href), "ok"));
    }

    /**
     * Return material to inventory on a WO (issuetype RETURN) — corrects an over- or wrong-issue.
     * Works even on a completed WO. Returns the refreshed material rows.
     */
    @PostMapping("/work-orders/{href}/return-material")
    public ResponseEntity<NgApiResponse<List<MaximoMaterialTxnDto>>> returnMaterial(
            @PathVariable String href, @RequestBody ReturnMaterialRequest req) {
        try {
            workOrders.returnMaterials(href, req.getLines(), req.getStoreroom());
            return ResponseEntity.ok(new NgApiResponse<>(workOrders.listMaterials(href), "returned"));
        } catch (Exception e) {
            log.warn("[Maximo] return material on {} failed: {}", href, e.getMessage());
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    /**
     * Issue additional material on an existing WO (issuetype ISSUE) — for a forgotten part or a swap.
     * Works even on a completed WO. Returns the refreshed material rows.
     */
    @PostMapping("/work-orders/{href}/issue-material")
    public ResponseEntity<NgApiResponse<List<MaximoMaterialTxnDto>>> issueMaterial(
            @PathVariable String href, @RequestBody IssueMaterialRequest req) {
        try {
            workOrders.addMaterials(href, req.getLines(), req.getStoreroom());
            return ResponseEntity.ok(new NgApiResponse<>(workOrders.listMaterials(href), "issued"));
        } catch (Exception e) {
            log.warn("[Maximo] issue material on {} failed: {}", href, e.getMessage());
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    // ---- Parts checkout (locations / work-types / inventory / flow) -------

    @GetMapping("/locations")
    public ResponseEntity<NgApiResponse<List<MaximoLocationDto>>> searchLocations(
            @RequestParam(value = "q", required = false) String q,
            @RequestParam(value = "siteid", required = false) String siteid,
            @RequestParam(value = "pageSize", defaultValue = "100") int pageSize) {
        return ResponseEntity.ok(new NgApiResponse<>(locations.search(q, siteid, pageSize), "ok"));
    }

    /**
     * The operating-location chain above a location, leaf first. Lets an SR be filed one level up when the
     * broken thing isn't an asset itself. Query param, not a path variable — location codes are free-form.
     */
    @GetMapping("/location-ancestors")
    public ResponseEntity<NgApiResponse<List<MaximoLocationDto>>> locationAncestors(
            @RequestParam("location") String location,
            @RequestParam(value = "siteid", required = false) String siteid) {
        return ResponseEntity.ok(new NgApiResponse<>(locations.ancestors(location, siteid), "ok"));
    }

    @GetMapping("/work-types")
    public ResponseEntity<NgApiResponse<List<Map<String, String>>>> getWorkTypes() {
        return ResponseEntity.ok(new NgApiResponse<>(WORK_TYPES, "ok"));
    }

    /**
     * Active people who can be credited with labor — name + Maximo personid. Used by the
     * Complete-WO labor dropdown. Non-admin (lives under /ng/maximo) and discloses only names +
     * personids, which are already visible on work orders.
     */
    @GetMapping("/labor-people")
    public ResponseEntity<NgApiResponse<List<Map<String, String>>>> getLaborPeople() {
        List<Map<String, String>> people = new ArrayList<>();
        for (com.dk_power.power_plant_java.entities.users.User u : userRepo.findByIsActiveTrue()) {
            String pid = u.getMaximoPersonid();
            if (pid == null || pid.isBlank()) continue;
            String name = (u.getName() != null && !u.getName().isBlank()) ? u.getName() : pid;
            people.add(Map.of("name", name, "personid", pid));
        }
        people.sort((a, b) -> a.get("name").compareToIgnoreCase(b.get("name")));
        return ResponseEntity.ok(new NgApiResponse<>(people, people.size() + " people"));
    }

    /** Served from the in-memory catalog (see {@link MaximoInventoryCatalogService}) — never blocks on Maximo. */
    @GetMapping("/inventory")
    public ResponseEntity<NgApiResponse<List<MaximoInventoryItemDto>>> searchInventory(
            @RequestParam(value = "q", required = false) String q,
            @RequestParam(value = "siteid", required = false) String siteid,
            @RequestParam(value = "storeroom", required = false) String storeroom,
            @RequestParam(value = "pageSize", defaultValue = "50") int pageSize) {
        return ResponseEntity.ok(new NgApiResponse<>(
                inventoryCatalog.search(q, siteid, storeroom, pageSize), "ok"));
    }

    /** Warehouses (storerooms) that hold stock at the site — for the inventory warehouse filter. */
    @GetMapping("/inventory/storerooms")
    public ResponseEntity<NgApiResponse<List<String>>> inventoryStorerooms(
            @RequestParam(value = "siteid", required = false) String siteid) {
        return ResponseEntity.ok(new NgApiResponse<>(inventoryCatalog.storerooms(siteid), "ok"));
    }

    /**
     * Whether the inventory catalog is loaded. Empty search results mean "no match" once ready, and
     * "still building" before that — the UI needs to tell those apart. Requesting this also warms the catalog.
     */
    @GetMapping("/inventory-catalog/status")
    public ResponseEntity<NgApiResponse<Map<String, Object>>> inventoryCatalogStatus() {
        return ResponseEntity.ok(new NgApiResponse<>(inventoryCatalog.status(), "ok"));
    }

    /** Full stock detail for one item (on-hand, reserved, reorder levels, cost, usage stats). */
    @GetMapping("/inventory/{itemnum}")
    public ResponseEntity<NgApiResponse<MaximoInventoryStockDto>> getInventoryItem(
            @PathVariable String itemnum,
            @RequestParam(value = "siteid", required = false) String siteid,
            @RequestParam(value = "storeroom", required = false) String storeroom) {
        return inventory.getStock(itemnum, siteid, storeroom)
                .map(s -> ResponseEntity.ok(new NgApiResponse<>(s, "ok")))
                .orElseGet(() -> ResponseEntity.ok(new NgApiResponse<>(null, "not found")));
    }

    /** Material-use history for one item (which WOs consumed it), newest first. */
    @GetMapping("/inventory/{itemnum}/usage")
    public ResponseEntity<NgApiResponse<List<MaximoInventoryUsageDto>>> getInventoryUsage(
            @PathVariable String itemnum,
            @RequestParam(value = "siteid", required = false) String siteid,
            @RequestParam(value = "storeroom", required = false) String storeroom,
            @RequestParam(value = "pageSize", defaultValue = "50") int pageSize) {
        return ResponseEntity.ok(new NgApiResponse<>(
                inventory.getUsage(itemnum, siteid, storeroom, pageSize), "ok"));
    }

    /**
     * Parts checkout: create a WO, approve it, issue the material lines, and complete it.
     * Returns the created WO number, final status, and actual material cost.
     */
    @PostMapping("/parts-checkout")
    public ResponseEntity<NgApiResponse<PartsCheckoutResult>> checkoutParts(
            @RequestBody PartsCheckoutRequest req) {
        try {
            return ResponseEntity.ok(new NgApiResponse<>(partsCheckout.checkout(req), "checked out"));
        } catch (Exception e) {
            log.warn("[Maximo] parts checkout failed: {}", e.getMessage());
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    // ---- PM auto-assignment (recurring-PM catalog + WAPPR approval) ------

    /** The recurring-PM catalog (deduped by pmnum). */
    @GetMapping("/pm/catalog")
    public ResponseEntity<NgApiResponse<List<RecurringPmDto>>> pmCatalog() {
        return ResponseEntity.ok(new NgApiResponse<>(recurringPms.getCatalog(), "ok"));
    }

    /** Rebuild the catalog from ~1 year of PM work orders led by lead operators. */
    @PostMapping("/pm/catalog/refresh")
    public ResponseEntity<NgApiResponse<Map<String, Object>>> pmCatalogRefresh() {
        try {
            return ResponseEntity.ok(new NgApiResponse<>(recurringPms.refreshCatalog(), "catalog refreshed"));
        } catch (Exception e) {
            log.warn("[Maximo] PM catalog refresh failed: {}", e.getMessage());
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    /** Set a PM's shift and/or cadence (locks it against catalog-refresh overwrite). Keyed by row id. */
    @PutMapping("/pm/catalog/{id}")
    public ResponseEntity<NgApiResponse<RecurringPmDto>> pmClassify(
            @PathVariable Long id, @RequestBody ClassifyRequest req) {
        try {
            return ResponseEntity.ok(new NgApiResponse<>(
                    recurringPms.updateClassification(id, req.shift(), req.cadence(), req.dayOfWeek()), "updated"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    /** Assign (or clear, when empty) the electronic completion form(s) for a recurring PM. */
    @PutMapping("/pm/catalog/{id}/form")
    public ResponseEntity<NgApiResponse<RecurringPmDto>> pmAssignForm(
            @PathVariable Long id, @RequestBody FormAssignRequest req) {
        try {
            // Prefer the multi-form list; fall back to the legacy single formKey for older clients.
            RecurringPmDto updated = (req.formKeys() != null)
                    ? recurringPms.assignForms(id, req.formKeys())
                    : recurringPms.assignForm(id, req.formKey());
            return ResponseEntity.ok(new NgApiResponse<>(updated, "updated"));
        } catch (Exception e) {
            log.warn("[Maximo] PM assign-form {} failed: {}", id, e.getMessage());
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    /** Enable/disable + set the "GenSuit" confirmation phrase for a recurring PM. Returns the updated PM. */
    @PutMapping("/pm/catalog/{id}/gensuit")
    public ResponseEntity<NgApiResponse<RecurringPmDto>> pmGenSuit(
            @PathVariable Long id, @RequestBody GenSuitRequest req) {
        try {
            return ResponseEntity.ok(new NgApiResponse<>(
                    recurringPms.updateGenSuit(id, req.enabled(), req.phrase()), "updated"));
        } catch (Exception e) {
            log.warn("[Maximo] PM gensuit {} failed: {}", id, e.getMessage());
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    /** GenSuit {enabled, phrase} for a WO's pmnum — lets the WO details dialog resolve by {@code wo.pmnum}. */
    @GetMapping("/pm/catalog/gensuit")
    public ResponseEntity<NgApiResponse<RecurringPmService.GenSuitInfo>> pmGenSuitForWo(
            @RequestParam String pmnum) {
        return ResponseEntity.ok(new NgApiResponse<>(recurringPms.genSuitForPmnum(pmnum), "ok"));
    }

    /** Manually convert a work order into a recurring-PM catalog entry (auto-detection missed it). */
    @PostMapping("/pm/catalog/from-wo")
    public ResponseEntity<NgApiResponse<RecurringPmDto>> pmMakeRecurring(@RequestBody MakeRecurringRequest req) {
        try {
            return ResponseEntity.ok(new NgApiResponse<>(
                    recurringPms.manualAdd(req.pmnum(), req.description(), req.lead(), req.wonum()), "created"));
        } catch (Exception e) {
            log.warn("[Maximo] PM make-recurring failed: {}", e.getMessage());
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    /** A catalog PM's real Maximo work orders (history + upcoming), matched by pmnum or description. */
    @GetMapping("/pm/catalog/{id}/occurrences")
    public ResponseEntity<NgApiResponse<List<PmOccurrenceDto>>> pmOccurrences(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(new NgApiResponse<>(recurringPms.occurrences(id), "ok"));
        } catch (Exception e) {
            log.warn("[Maximo] PM occurrences {} failed: {}", id, e.getMessage());
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    /** WAPPR recurring-PM WOs with a proposed shift-based assignee. */
    @GetMapping("/pm/pending-assignments")
    public ResponseEntity<NgApiResponse<List<PmPendingAssignmentDto>>> pmPending() {
        return ResponseEntity.ok(new NgApiResponse<>(pmAssignments.pendingAssignments(), "ok"));
    }

    /** Lead operators (id, schedule alias, personid) — lets the schedule peek flag which roster people are leads. */
    @GetMapping("/pm/leads")
    public ResponseEntity<NgApiResponse<List<PmLeadDto>>> pmLeads() {
        return ResponseEntity.ok(new NgApiResponse<>(pmAssignments.leads(), "ok"));
    }

    /** Approve + assign a batch: set each WO's lead and move it to APPR. */
    @PostMapping("/pm/assign")
    public ResponseEntity<NgApiResponse<Map<String, Object>>> pmAssign(@RequestBody PmAssignRequest req) {
        try {
            return ResponseEntity.ok(new NgApiResponse<>(pmAssignments.assign(req), "assigned"));
        } catch (Exception e) {
            log.warn("[Maximo] PM assign failed: {}", e.getMessage());
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    public record ClassifyRequest(ShiftPreference shift, RecurrenceCadence cadence, Integer dayOfWeek) {}

    /** Body for assigning completion form(s) to a recurring PM. {@code formKeys} (empty clears); {@code formKey} is legacy. */
    public record FormAssignRequest(String formKey, List<String> formKeys) {}

    /** Body for enabling + setting a recurring PM's GenSuit confirmation phrase. */
    public record GenSuitRequest(Boolean enabled, String phrase) {}

    /** Body for manually converting a WO to a recurring task — the fields we already have on the pending row. */
    public record MakeRecurringRequest(String pmnum, String description, String lead, String wonum) {}

    /** Maximo personid of the signed-in desktop user, or null if not resolvable. */
    private String currentUserPersonid() {
        var auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) return null;
        Object principal = auth.getPrincipal();
        if (!(principal instanceof com.dk_power.power_plant_java.sevice.users.impl.CustomUserDetails cud)) return null;
        return userRepo.findById(cud.getId())
                .map(com.dk_power.power_plant_java.entities.users.User::getMaximoPersonid)
                .orElse(null);
    }

    // ---- Physical hierarchy (Maximo seed + per-node WO/SR tab) -----------

    /**
     * Seed/refresh the {@link PhysicalObject} tree from Maximo (locations + assets). Idempotent — upserts by
     * key, never clobbers local edits/nodes. Intended for the hub (propagates via sync); runnable on a desktop
     * for verification.
     */
    @PostMapping("/physical-object/reseed")
    public ResponseEntity<NgApiResponse<PhysicalObjectMaximoSeeder.SeedResult>> reseedPhysicalObjects(
            @RequestParam(value = "siteid", required = false) String siteid) {
        try {
            return ResponseEntity.ok(new NgApiResponse<>(physicalObjectSeeder.reseed(siteid), "seeded"));
        } catch (Exception e) {
            log.warn("[Maximo] physical-object reseed failed: {}", e.getMessage());
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    /**
     * The Maximo tab for a physical-object node: its work orders + service requests, scoped by the node's
     * {@code maximoAssetnum} (equipment) or exact {@code maximoLocation} (hierarchy node). Subtree roll-up is a
     * later refinement; inventory isn't object-scoped so it's not included here.
     */
    @GetMapping("/physical-object/{id}")
    public ResponseEntity<NgApiResponse<PhysicalObjectMaximoTab>> physicalObjectMaximo(@PathVariable Long id) {
        try {
            PhysicalObject node = physicalObjects.findById(id).orElse(null);
            if (node == null) return ResponseEntity.ok(new NgApiResponse<>(null, "not found"));
            String assetnum = node.getMaximoAssetnum();
            String location = node.getMaximoLocation();
            List<MaximoWorkOrderDto> wos = List.of();
            List<MaximoServiceRequestDto> srs = List.of();
            if (assetnum != null && !assetnum.isBlank()) {
                wos = workOrders.listForAsset(assetnum, 50);
                srs = serviceRequests.listForAsset(assetnum, 50);
            } else if (location != null && !location.isBlank()) {
                MaximoWorkOrderCriteria wc = new MaximoWorkOrderCriteria();
                wc.setLocation(location);
                wos = workOrders.listByCriteria(wc, 50);
                MaximoServiceRequestCriteria sc = new MaximoServiceRequestCriteria();
                sc.setLocation(location);
                srs = serviceRequests.listByCriteria(sc, 50);
            }
            return ResponseEntity.ok(new NgApiResponse<>(
                    new PhysicalObjectMaximoTab(assetnum, location, wos, srs), "ok"));
        } catch (Exception e) {
            log.warn("[Maximo] physical-object {} tab failed: {}", id, e.getMessage());
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    /** WOs + SRs for a physical-object node's Maximo link. */
    public record PhysicalObjectMaximoTab(String assetnum, String location,
            List<MaximoWorkOrderDto> workOrders, List<MaximoServiceRequestDto> serviceRequests) {}

    // ---- Bundles (cross-source aggregations) -----------------------------

    /**
     * All Maximo work orders whose `spi:lead` is one of the local Lead Operators.
     * Optional `status` query param narrows to that status (e.g. APPR / INPRG).
     */
    @GetMapping("/bundle/lead-operators/work-orders")
    public ResponseEntity<NgApiResponse<List<MaximoWorkOrderDto>>> leadOperatorWorkOrders(
            @RequestParam(value = "pageSize", defaultValue = "100") int pageSize,
            @RequestParam(value = "status", required = false) String status) {
        return ResponseEntity.ok(new NgApiResponse<>(
                bundles.leadOperatorWorkOrders(pageSize, status), "ok"));
    }

    /**
     * Work orders for a tracked people set (leads or custom personids), optionally filtered to one status
     * (blank = all statuses). Backs the "All" tab, whose status filter defaults to APPR but is changeable/clearable.
     */
    @GetMapping("/bundle/people-work-orders")
    public ResponseEntity<NgApiResponse<List<MaximoWorkOrderDto>>> peopleWorkOrders(
            @RequestParam(value = "mode", defaultValue = "leads") String mode,
            @RequestParam(value = "personids", required = false) String personids,
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "pageSize", defaultValue = "500") int pageSize) {
        List<String> ids = (personids == null || personids.isBlank())
                ? List.of()
                : Arrays.stream(personids.split(",")).map(String::trim).filter(s -> !s.isEmpty()).toList();
        return ResponseEntity.ok(new NgApiResponse<>(bundles.peopleWorkOrders(mode, ids, status, pageSize), "ok"));
    }

    // ── Ticket→asset index (search WOs/SRs by equipment tag) ──────────────────────

    /**
     * One-time backfill: index every SR + WO from the last {@code years} years, matching each to an asset by
     * tag. Meant to run on the hub (it hits Maximo + syncs the result). {@code dryRun=true} counts without saving.
     */
    @PostMapping("/ticket-index/backfill")
    public ResponseEntity<NgApiResponse<Map<String, Object>>> ticketIndexBackfill(
            @RequestParam(value = "years", defaultValue = "5") int years,
            @RequestParam(value = "dryRun", defaultValue = "false") boolean dryRun) {
        try {
            return ResponseEntity.ok(new NgApiResponse<>(ticketIndex.backfill(years, dryRun), "ok"));
        } catch (Exception e) {
            log.warn("[Maximo] ticket-index backfill failed: {}", e.getMessage());
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    /** Run the incremental update now (tickets changed since the last run). Normally runs on a hub timer. */
    @PostMapping("/ticket-index/incremental")
    public ResponseEntity<NgApiResponse<Map<String, Object>>> ticketIndexIncremental(
            @RequestParam(value = "dryRun", defaultValue = "false") boolean dryRun) {
        try {
            return ResponseEntity.ok(new NgApiResponse<>(ticketIndex.incremental(dryRun), "ok"));
        } catch (Exception e) {
            log.warn("[Maximo] ticket-index incremental failed: {}", e.getMessage());
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    /** Search the ticket index by (partial) equipment tag number. */
    @GetMapping("/ticket-index/search")
    public ResponseEntity<NgApiResponse<List<MaximoTicketAssetDto>>> ticketIndexSearch(
            @RequestParam("tag") String tag,
            @RequestParam(value = "limit", defaultValue = "50") int limit) {
        return ResponseEntity.ok(new NgApiResponse<>(ticketIndex.searchByTag(tag, limit), "ok"));
    }

    // ---- Worklog (notes / comments) --------------------------------------

    @GetMapping("/{parent}/{href}/worklog")
    public ResponseEntity<NgApiResponse<List<MaximoWorklogDto>>> listWorklog(
            @PathVariable String parent, @PathVariable String href) {
        List<MaximoWorklogDto> result = switch (parent.toLowerCase()) {
            case "sr", "service-request", "service-requests" -> worklog.listForSr(href);
            case "wo", "work-order", "work-orders"           -> worklog.listForWo(href);
            default -> List.of();
        };
        return ResponseEntity.ok(new NgApiResponse<>(result, "ok"));
    }

    // ---- Attachments (doclinks) ------------------------------------------

    @GetMapping("/{parent}/{href}/attachments")
    public ResponseEntity<NgApiResponse<List<MaximoDoclinkDto>>> listAttachments(
            @PathVariable String parent, @PathVariable String href) {
        return ResponseEntity.ok(new NgApiResponse<>(
                doclinks.list(resolveParent(parent), href), "ok"));
    }

    @GetMapping("/{parent}/{href}/attachments/{attachmentId}/content")
    public ResponseEntity<byte[]> downloadAttachment(
            @PathVariable String parent,
            @PathVariable String href,
            @PathVariable String attachmentId) {
        ResponseEntity<byte[]> upstream = doclinks.streamBinary(resolveParent(parent), href, attachmentId);
        org.springframework.http.HttpHeaders out = new org.springframework.http.HttpHeaders();
        if (upstream.getHeaders().getContentType() != null) {
            out.setContentType(upstream.getHeaders().getContentType());
        }
        long len = upstream.getHeaders().getContentLength();
        if (len > 0) out.setContentLength(len);
        // Inline disposition so the browser previews images/PDFs in a new tab instead of forcing a download.
        out.set(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION, "inline");
        return new ResponseEntity<>(upstream.getBody(), out, upstream.getStatusCode());
    }

    @PostMapping("/{parent}/{href}/attachments")
    public ResponseEntity<NgApiResponse<MaximoDoclinkDto>> uploadAttachment(
            @PathVariable String parent,
            @PathVariable String href,
            @RequestPart("file") MultipartFile file,
            @RequestParam(value = "doctype", required = false) String doctype) throws IOException {
        MaximoDoclinkDto created = doclinks.upload(
                resolveParent(parent),
                href,
                file.getOriginalFilename(),
                file.getContentType(),
                file.getBytes(),
                doctype);
        return ResponseEntity.ok(new NgApiResponse<>(created, "uploaded"));
    }

    /** Map friendly path keys to Maximo OS names so the frontend doesn't need to know them. */
    private String resolveParent(String parent) {
        return switch (parent.toLowerCase()) {
            case "asset", "assets", "mxasset" -> "mxasset";
            case "sr", "service-request", "service-requests", "mxapisr" -> "mxapisr";
            case "wo", "work-order", "work-orders", "mxapiwodetail" -> "mxapiwodetail";
            default -> parent;
        };
    }
}
