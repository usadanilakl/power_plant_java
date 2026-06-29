package com.dk_power.power_plant_java.controller.angular;

import com.dk_power.power_plant_java.dto.maximo.CompleteWorkOrderRequest;
import com.dk_power.power_plant_java.dto.maximo.CreateMaximoServiceRequestDto;
import com.dk_power.power_plant_java.dto.maximo.MaximoInventoryItemDto;
import com.dk_power.power_plant_java.dto.maximo.MaximoLocationDto;
import com.dk_power.power_plant_java.dto.maximo.IssueMaterialRequest;
import com.dk_power.power_plant_java.dto.maximo.MaximoMaterialTxnDto;
import com.dk_power.power_plant_java.dto.maximo.ReturnMaterialRequest;
import com.dk_power.power_plant_java.dto.maximo.PartsCheckoutRequest;
import com.dk_power.power_plant_java.dto.maximo.PartsCheckoutResult;
import com.dk_power.power_plant_java.dto.maximo.PmAssignRequest;
import com.dk_power.power_plant_java.dto.maximo.PmPendingAssignmentDto;
import com.dk_power.power_plant_java.dto.maximo.RecurringPmDto;
import com.dk_power.power_plant_java.entities.maximo.RecurrenceCadence;
import com.dk_power.power_plant_java.entities.maximo.ShiftPreference;
import com.dk_power.power_plant_java.sevice.maximo.MaximoInventoryAdapter;
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
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
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
@ConditionalOnProperty(name = "maximo.api-key")
public class NgMaximoController {

    private final MaximoAssetAdapter assets;
    private final MaximoServiceRequestAdapter serviceRequests;
    private final MaximoWorkOrderAdapter workOrders;
    private final MaximoDoclinksAdapter doclinks;
    private final MaximoWorklogAdapter worklog;
    private final MaximoBundleService bundles;
    private final MaximoLocationAdapter locations;
    private final MaximoInventoryAdapter inventory;
    private final MaximoPartsCheckoutService partsCheckout;
    private final RecurringPmService recurringPms;
    private final PmAssignmentService pmAssignments;
    private final com.dk_power.power_plant_java.repository.users.UserRepo userRepo;

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
            @RequestParam(value = "pageSize", defaultValue = "25") int pageSize) {
        List<MaximoAssetDto> result = assets.search(tag, siteid, pageSize);
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
            @RequestParam(value = "descriptionContains", required = false) String descriptionContains,
            @RequestParam(value = "longDescriptionContains", required = false) String longDescriptionContains,
            @RequestParam(value = "siteid", required = false) String siteid,
            @RequestParam(value = "pageSize", defaultValue = "50") int pageSize) {
        MaximoServiceRequestCriteria c = new MaximoServiceRequestCriteria();
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
        return ResponseEntity.ok(new NgApiResponse<>(
                serviceRequests.listByCriteria(c, pageSize), "ok"));
    }

    @PostMapping("/service-requests")
    public ResponseEntity<NgApiResponse<MaximoServiceRequestDto>> createSr(
            @RequestBody CreateMaximoServiceRequestDto body) {
        MaximoServiceRequestDto created = serviceRequests.create(body);
        return ResponseEntity.ok(new NgApiResponse<>(created, "created"));
    }

    @GetMapping("/service-requests/{href}")
    public ResponseEntity<NgApiResponse<MaximoServiceRequestDto>> getSr(@PathVariable String href) {
        return serviceRequests.findByHref(href)
                .map(sr -> ResponseEntity.ok(new NgApiResponse<>(sr, "ok")))
                .orElseGet(() -> ResponseEntity.ok(new NgApiResponse<>(null, "not found")));
    }

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
            @RequestParam(value = "descriptionContains", required = false) String descriptionContains,
            @RequestParam(value = "longDescriptionContains", required = false) String longDescriptionContains,
            @RequestParam(value = "wonumContains", required = false) String wonumContains,
            @RequestParam(value = "siteid", required = false) String siteid,
            @RequestParam(value = "pageSize", defaultValue = "50") int pageSize) {
        MaximoWorkOrderCriteria c = new MaximoWorkOrderCriteria();
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
        return ResponseEntity.ok(new NgApiResponse<>(
                workOrders.listByCriteria(c, pageSize), "ok"));
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

    @GetMapping("/inventory")
    public ResponseEntity<NgApiResponse<List<MaximoInventoryItemDto>>> searchInventory(
            @RequestParam(value = "q", required = false) String q,
            @RequestParam(value = "siteid", required = false) String siteid,
            @RequestParam(value = "storeroom", required = false) String storeroom,
            @RequestParam(value = "pageSize", defaultValue = "50") int pageSize) {
        return ResponseEntity.ok(new NgApiResponse<>(
                inventory.search(q, siteid, storeroom, pageSize), "ok"));
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

    /** WAPPR recurring-PM WOs with a proposed shift-based assignee. */
    @GetMapping("/pm/pending-assignments")
    public ResponseEntity<NgApiResponse<List<PmPendingAssignmentDto>>> pmPending() {
        return ResponseEntity.ok(new NgApiResponse<>(pmAssignments.pendingAssignments(), "ok"));
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
