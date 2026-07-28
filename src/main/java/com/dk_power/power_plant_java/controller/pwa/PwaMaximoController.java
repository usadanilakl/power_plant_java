package com.dk_power.power_plant_java.controller.pwa;

import com.dk_power.power_plant_java.controller.angular.NgApiResponse;
import com.dk_power.power_plant_java.dto.maximo.CompleteWorkOrderRequest;
import com.dk_power.power_plant_java.dto.maximo.CreateMaximoServiceRequestDto;
import com.dk_power.power_plant_java.dto.maximo.MaximoDoclinkDto;
import com.dk_power.power_plant_java.dto.maximo.MaximoFormSubmissionDto;
import com.dk_power.power_plant_java.dto.maximo.MaximoFormTemplateDto;
import com.dk_power.power_plant_java.dto.maximo.MaximoInventoryItemDto;
import com.dk_power.power_plant_java.dto.maximo.MaximoLocationDto;
import com.dk_power.power_plant_java.dto.maximo.MaximoOverviewDto;
import com.dk_power.power_plant_java.dto.maximo.PartsCheckoutRequest;
import com.dk_power.power_plant_java.dto.maximo.PartsCheckoutResult;
import com.dk_power.power_plant_java.dto.maximo.MaximoServiceRequestCriteria;
import com.dk_power.power_plant_java.dto.maximo.MaximoServiceRequestDto;
import com.dk_power.power_plant_java.dto.maximo.MaximoWorkOrderCriteria;
import com.dk_power.power_plant_java.dto.maximo.MaximoWorkOrderDto;
import com.dk_power.power_plant_java.dto.maximo.MaximoWorklogDto;
import com.dk_power.power_plant_java.dto.maximo.AddWorklogRequest;
import com.dk_power.power_plant_java.entities.users.User;
import com.dk_power.power_plant_java.repository.users.UserRepo;
import com.dk_power.power_plant_java.entities.maximo.RecurringPm;
import com.dk_power.power_plant_java.sevice.maximo.MaximoBundleService;
import com.dk_power.power_plant_java.sevice.maximo.MaximoDoclinksAdapter;
import com.dk_power.power_plant_java.sevice.maximo.MaximoFormCompletionService;
import com.dk_power.power_plant_java.sevice.maximo.MaximoFormService;
import com.dk_power.power_plant_java.sevice.maximo.MaximoInventoryCatalogService;
import com.dk_power.power_plant_java.sevice.maximo.MaximoLocationAdapter;
import com.dk_power.power_plant_java.sevice.maximo.MaximoPartsCheckoutService;
import com.dk_power.power_plant_java.sevice.maximo.MaximoServiceRequestAdapter;
import com.dk_power.power_plant_java.sevice.maximo.MaximoWorkOrderAdapter;
import com.dk_power.power_plant_java.sevice.maximo.MaximoWorklogAdapter;
import com.dk_power.power_plant_java.sevice.maximo.RecurringPmService;
import com.dk_power.power_plant_java.sevice.users.impl.CustomUserDetails;
import org.springframework.web.multipart.MultipartFile;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Mobile (PWA) access to Maximo for Plant staff — mirrors the desktop {@link com.dk_power.power_plant_java.controller.angular.NgMaximoController}
 * but under {@code /api/pwa/secured/maximo/**} (JWT + ROLE_PLANT/ADMIN) and phone-shaped. Reuses the exact same
 * {@code sevice/maximo} beans, so this is a thin proxy, not a reimplementation.
 *
 * <p>Gated with {@code @ConditionalOnProperty(name="maximo.api-key")} like the Maximo beans it injects — without
 * that the beans don't exist and the context would fail to start. Phase 1: search WO/SR + create SR.</p>
 */
@RestController
@RequestMapping("/api/pwa/secured/maximo")
@RequiredArgsConstructor
@Slf4j
@ConditionalOnProperty(name = "maximo.api-key")
@CrossOrigin(originPatterns = {"https://dk-power.github.io", "https://jacksongeneration.github.io", "http://localhost:*", "http://127.0.0.1:*"}, allowCredentials = "true")
public class PwaMaximoController {

    private final MaximoWorkOrderAdapter workOrders;
    private final MaximoServiceRequestAdapter serviceRequests;
    private final MaximoLocationAdapter locations;
    private final MaximoInventoryCatalogService inventoryCatalog;
    private final MaximoPartsCheckoutService partsCheckout;
    private final MaximoDoclinksAdapter doclinks;
    private final MaximoWorklogAdapter worklog;
    private final MaximoBundleService bundles;
    private final RecurringPmService recurringPms;
    private final MaximoFormService forms;
    private final MaximoFormCompletionService completion;
    private final UserRepo userRepo;

    // ── Work orders ────────────────────────────────────────────────────────────

    /** Search work orders (newest-first when no filter). Mobile subset of the desktop criteria. */
    @GetMapping("/work-orders")
    public ResponseEntity<NgApiResponse<List<MaximoWorkOrderDto>>> workOrders(
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "worktype", required = false) String worktype,
            @RequestParam(value = "assetnum", required = false) String assetnum,
            @RequestParam(value = "location", required = false) String location,
            @RequestParam(value = "priority", required = false) String priority,
            @RequestParam(value = "reportedby", required = false) String reportedby,
            @RequestParam(value = "textContains", required = false) String textContains,
            @RequestParam(value = "siteid", required = false) String siteid,
            @RequestParam(value = "pageSize", defaultValue = "50") int pageSize) {
        try {
            MaximoWorkOrderCriteria c = new MaximoWorkOrderCriteria();
            c.setStatus(status);
            c.setWorktype(worktype);
            c.setAssetnum(assetnum);
            c.setLocation(location);
            c.setPriority(priority);
            c.setReportedby(reportedby);
            c.setTextContains(textContains);
            c.setSiteid(siteid);
            List<MaximoWorkOrderDto> result = c.hasAnyFilter()
                    ? workOrders.listByCriteria(c, pageSize)
                    : workOrders.listLatest(siteid, pageSize);
            return ResponseEntity.ok(new NgApiResponse<>(result, "ok"));
        } catch (Exception e) {
            log.warn("[PWA-Maximo] WO search failed: {}", e.getMessage());
            return ResponseEntity.ok(new NgApiResponse<>(List.of(), "Failed: " + e.getMessage()));
        }
    }

    /** Child tasks of a work order (istask=1 rows), for the Tasks tab. {@code wonum} is the parent's number. */
    @GetMapping("/work-orders/{wonum}/tasks")
    public ResponseEntity<NgApiResponse<List<MaximoWorkOrderDto>>> workOrderTasks(@PathVariable String wonum) {
        try {
            return ResponseEntity.ok(new NgApiResponse<>(workOrders.listTasks(wonum), "ok"));
        } catch (Exception e) {
            log.warn("[PWA-Maximo] WO tasks failed for {}: {}", wonum, e.getMessage());
            return ResponseEntity.ok(new NgApiResponse<>(List.of(), "Failed: " + e.getMessage()));
        }
    }

    /**
     * Complete a work order (or a task — a task is itself a WO): report labor + a worklog note, then change
     * status (default COMP). Blank laborcode defaults to the signed-in user. {@code href} is a query param so
     * Maximo hrefs (which contain slashes/colons) don't break path matching.
     */
    @PostMapping("/work-orders/complete")
    public ResponseEntity<NgApiResponse<MaximoWorkOrderDto>> completeWorkOrder(
            @RequestParam("href") String href, @RequestBody CompleteWorkOrderRequest req) {
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
            log.warn("[PWA-Maximo] complete WO failed: {}", e.getMessage());
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Failed: " + e.getMessage()));
        }
    }

    /**
     * "Grab" a work order for offline work: mark it in-progress (INPRG) and assign it to the signed-in user
     * (the reservation), then return the refreshed WO. Must be online — the client then caches the WO + its
     * form/tasks locally and performs offline. NOTE: only COMP transitions are Maximo-verified on this instance;
     * verify WAPPR/APPR→INPRG works live.
     */
    @PostMapping("/work-orders/grab")
    public ResponseEntity<NgApiResponse<MaximoWorkOrderDto>> grabWorkOrder(
            @RequestParam("href") String href,
            @RequestParam(value = "memo", required = false) String memo) {
        try {
            workOrders.changeStatus(href, "INPRG", memo != null ? memo : "Grabbed via mobile");
            String pid = currentUserPersonid();
            if (pid != null && !pid.isBlank()) {
                try {
                    workOrders.setLead(href, pid);
                } catch (Exception le) {
                    log.warn("[PWA-Maximo] setLead on grab failed: {}", le.getMessage());
                }
            }
            return workOrders.findByHref(href)
                    .map(wo -> ResponseEntity.ok(new NgApiResponse<>(wo, "grabbed")))
                    .orElseGet(() -> ResponseEntity.ok(new NgApiResponse<>(null, "grabbed")));
        } catch (Exception e) {
            log.warn("[PWA-Maximo] grab failed: {}", e.getMessage());
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Failed: " + e.getMessage()));
        }
    }

    // ── Work-order attachments (doclinks) & notes (worklog) ────────────────────
    // href is a query param throughout — Maximo hrefs contain slashes/colons that break path matching.

    /** List a work order's attachments (photos/PDFs/docs). */
    @GetMapping("/work-orders/attachments")
    public ResponseEntity<NgApiResponse<List<MaximoDoclinkDto>>> listWoAttachments(@RequestParam("href") String href) {
        try {
            return ResponseEntity.ok(new NgApiResponse<>(doclinks.list("mxapiwodetail", href), "ok"));
        } catch (Exception e) {
            log.warn("[PWA-Maximo] WO attachments list failed: {}", e.getMessage());
            return ResponseEntity.ok(new NgApiResponse<>(List.of(), "Failed: " + e.getMessage()));
        }
    }

    /** Stream one attachment's bytes (inline, so the phone can preview an image/PDF). */
    @GetMapping("/work-orders/attachments/content")
    public ResponseEntity<byte[]> woAttachmentContent(
            @RequestParam("href") String href, @RequestParam("attachmentId") String attachmentId) {
        ResponseEntity<byte[]> upstream = doclinks.streamBinary("mxapiwodetail", href, attachmentId);
        org.springframework.http.HttpHeaders out = new org.springframework.http.HttpHeaders();
        if (upstream.getHeaders().getContentType() != null) out.setContentType(upstream.getHeaders().getContentType());
        long len = upstream.getHeaders().getContentLength();
        if (len > 0) out.setContentLength(len);
        out.set(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION, "inline");
        return new ResponseEntity<>(upstream.getBody(), out, upstream.getStatusCode());
    }

    /** Attach a photo/file to a work order (e.g. a field photo taken while performing a PM). */
    @PostMapping("/work-orders/attachment")
    public ResponseEntity<NgApiResponse<MaximoDoclinkDto>> uploadWoAttachment(
            @RequestPart("file") MultipartFile file,
            @RequestParam("href") String href,
            @RequestParam(value = "doctype", required = false, defaultValue = "Attachments") String doctype) {
        try {
            MaximoDoclinkDto created = doclinks.upload("mxapiwodetail", href,
                    file.getOriginalFilename(), file.getContentType(), file.getBytes(), doctype);
            return ResponseEntity.ok(new NgApiResponse<>(created, "uploaded"));
        } catch (Exception e) {
            log.warn("[PWA-Maximo] WO attachment upload failed: {}", e.getMessage());
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Attachment failed: " + e.getMessage()));
        }
    }

    /** List a work order's worklog notes (newest first, as the adapter returns them). */
    @GetMapping("/work-orders/worklog")
    public ResponseEntity<NgApiResponse<List<MaximoWorklogDto>>> listWoWorklog(@RequestParam("href") String href) {
        try {
            return ResponseEntity.ok(new NgApiResponse<>(worklog.listForWo(href), "ok"));
        } catch (Exception e) {
            log.warn("[PWA-Maximo] WO worklog list failed: {}", e.getMessage());
            return ResponseEntity.ok(new NgApiResponse<>(List.of(), "Failed: " + e.getMessage()));
        }
    }

    /** Add a note (worklog) to a work order — no labor, no status change. Returns the refreshed list. */
    @PostMapping("/work-orders/worklog")
    public ResponseEntity<NgApiResponse<List<MaximoWorklogDto>>> addWoWorklog(
            @RequestParam("href") String href, @RequestBody AddWorklogRequest req) {
        try {
            workOrders.reportActuals(href, null, req.getSummary(), req.getDetails(), req.getLogtype());
            return ResponseEntity.ok(new NgApiResponse<>(worklog.listForWo(href), "added"));
        } catch (Exception e) {
            log.warn("[PWA-Maximo] add WO worklog failed: {}", e.getMessage());
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Failed: " + e.getMessage()));
        }
    }

    // ── Service requests (= "work requests") ───────────────────────────────────

    /** Search service requests (newest-first when no filter). */
    @GetMapping("/service-requests")
    public ResponseEntity<NgApiResponse<List<MaximoServiceRequestDto>>> serviceRequests(
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "assetnum", required = false) String assetnum,
            @RequestParam(value = "location", required = false) String location,
            @RequestParam(value = "priority", required = false) String priority,
            @RequestParam(value = "reportedby", required = false) String reportedby,
            @RequestParam(value = "textContains", required = false) String textContains,
            @RequestParam(value = "siteid", required = false) String siteid,
            @RequestParam(value = "pageSize", defaultValue = "50") int pageSize) {
        try {
            MaximoServiceRequestCriteria c = new MaximoServiceRequestCriteria();
            c.setStatus(status);
            c.setAssetnum(assetnum);
            c.setLocation(location);
            c.setPriority(priority);
            c.setReportedby(reportedby);
            c.setTextContains(textContains);
            c.setSiteid(siteid);
            List<MaximoServiceRequestDto> result = c.hasAnyFilter()
                    ? serviceRequests.listByCriteria(c, pageSize)
                    : serviceRequests.listLatest(siteid, pageSize);
            return ResponseEntity.ok(new NgApiResponse<>(result, "ok"));
        } catch (Exception e) {
            log.warn("[PWA-Maximo] SR search failed: {}", e.getMessage());
            return ResponseEntity.ok(new NgApiResponse<>(List.of(), "Failed: " + e.getMessage()));
        }
    }

    /** Create a service request. Blank reportedby defaults to the signed-in user's Maximo personid. */
    @PostMapping("/service-requests")
    public ResponseEntity<NgApiResponse<MaximoServiceRequestDto>> createServiceRequest(
            @RequestBody CreateMaximoServiceRequestDto body) {
        try {
            if (body.getReportedby() == null || body.getReportedby().isBlank()) {
                body.setReportedby(currentUserPersonid());
            }
            MaximoServiceRequestDto created = serviceRequests.create(body);
            return ResponseEntity.ok(new NgApiResponse<>(created, "created"));
        } catch (Exception e) {
            log.warn("[PWA-Maximo] SR create failed: {}", e.getMessage());
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Failed: " + e.getMessage()));
        }
    }

    /** Attach a photo/file to a just-created SR. Best-effort — caller uploads after create succeeds. */
    @PostMapping("/service-requests/attachment")
    public ResponseEntity<NgApiResponse<MaximoDoclinkDto>> uploadSrAttachment(
            @RequestPart("file") MultipartFile file,
            @RequestParam("href") String href,
            @RequestParam(value = "doctype", required = false, defaultValue = "Attachments") String doctype) {
        try {
            MaximoDoclinkDto created = doclinks.upload("mxapisr", href,
                    file.getOriginalFilename(), file.getContentType(), file.getBytes(), doctype);
            return ResponseEntity.ok(new NgApiResponse<>(created, "uploaded"));
        } catch (Exception e) {
            log.warn("[PWA-Maximo] SR attachment upload failed: {}", e.getMessage());
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Attachment failed: " + e.getMessage()));
        }
    }

    // ── Reference pickers ──────────────────────────────────────────────────────

    /** Location search-as-you-type for filing an SR against a location. */
    @GetMapping("/locations")
    public ResponseEntity<NgApiResponse<List<MaximoLocationDto>>> searchLocations(
            @RequestParam(value = "q", required = false) String q,
            @RequestParam(value = "siteid", required = false) String siteid,
            @RequestParam(value = "pageSize", defaultValue = "50") int pageSize) {
        try {
            return ResponseEntity.ok(new NgApiResponse<>(locations.search(q, siteid, pageSize), "ok"));
        } catch (Exception e) {
            log.warn("[PWA-Maximo] location search failed: {}", e.getMessage());
            return ResponseEntity.ok(new NgApiResponse<>(List.of(), "Failed: " + e.getMessage()));
        }
    }

    // ── PM overview (overdue / due / upcoming) ─────────────────────────────────

    /**
     * PM overview bucketed overdue / due-this-week / upcoming (+ completed). {@code mode=leads} (default)
     * tracks the lead operators; {@code mode=mine} tracks the signed-in user. {@code pmOnly=true} (default)
     * restricts every bucket to PM work orders (worktype PM or a pmnum).
     */
    @GetMapping("/bundle/overview")
    public ResponseEntity<NgApiResponse<MaximoOverviewDto>> overview(
            @RequestParam(value = "mode", defaultValue = "leads") String mode,
            @RequestParam(value = "pmOnly", defaultValue = "true") boolean pmOnly,
            @RequestParam(value = "pageSize", defaultValue = "200") int pageSize) {
        try {
            MaximoOverviewDto ov;
            if ("mine".equalsIgnoreCase(mode)) {
                String pid = currentUserPersonid();
                List<String> ids = (pid == null || pid.isBlank()) ? List.of() : List.of(pid);
                ov = bundles.overview("people", ids, pageSize);
            } else {
                ov = bundles.overview("leads", null, pageSize);
            }
            if (pmOnly) filterToPm(ov);
            return ResponseEntity.ok(new NgApiResponse<>(ov, "ok"));
        } catch (Exception e) {
            log.warn("[PWA-Maximo] overview failed: {}", e.getMessage());
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Failed: " + e.getMessage()));
        }
    }

    private void filterToPm(MaximoOverviewDto ov) {
        if (ov == null) return;
        ov.setOverdue(pmOnly(ov.getOverdue()));
        ov.setDueThisWeek(pmOnly(ov.getDueThisWeek()));
        ov.setUpcoming(pmOnly(ov.getUpcoming()));
        ov.setCompletedThisWeek(pmOnly(ov.getCompletedThisWeek()));
        ov.setCompletedLastWeek(pmOnly(ov.getCompletedLastWeek()));
    }

    private List<MaximoWorkOrderDto> pmOnly(List<MaximoWorkOrderDto> list) {
        if (list == null) return List.of();
        return list.stream().filter(this::isPm).collect(Collectors.toList());
    }

    private boolean isPm(MaximoWorkOrderDto w) {
        if (w == null) return false;
        return "PM".equalsIgnoreCase(w.getWorktype()) || (w.getPmnum() != null && !w.getPmnum().isBlank());
    }

    // ── PM completion forms (dynamic, formKey-assigned) ────────────────────────

    /** The completion form(s) assigned to a WO's PM (by pmnum then description): none / one / several. */
    @GetMapping("/forms/for-wo")
    public ResponseEntity<NgApiResponse<List<MaximoFormTemplateDto>>> completionFormsForWo(
            @RequestParam(value = "pmnum", required = false) String pmnum,
            @RequestParam(value = "description", required = false) String description) {
        try {
            List<String> keys = recurringPms.findForWorkOrder(pmnum, description)
                    .map(RecurringPm::getFormKeyList).orElse(List.of());
            return ResponseEntity.ok(new NgApiResponse<>(forms.getTemplatesByFormKeys(keys), "ok"));
        } catch (Exception e) {
            log.warn("[PWA-Maximo] form for-wo failed: {}", e.getMessage());
            return ResponseEntity.ok(new NgApiResponse<>(List.of(), "Failed: " + e.getMessage()));
        }
    }

    /** Submit a completed PM form: renders the PDF, attaches it to the WO, write-backs, advances status. */
    @PostMapping("/forms/complete")
    public ResponseEntity<NgApiResponse<MaximoFormSubmissionDto>> completeForm(@RequestBody MaximoFormSubmissionDto dto) {
        try {
            return ResponseEntity.ok(new NgApiResponse<>(completion.completeFromDto(dto), "completed"));
        } catch (Exception e) {
            log.warn("[PWA-Maximo] form complete failed: {}", e.getMessage());
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Failed: " + e.getMessage()));
        }
    }

    // ── Parts checkout ──────────────────────────────────────────────────────────

    /** Inventory search (from the in-memory catalog — never blocks on Maximo). */
    @GetMapping("/inventory")
    public ResponseEntity<NgApiResponse<List<MaximoInventoryItemDto>>> searchInventory(
            @RequestParam(value = "q", required = false) String q,
            @RequestParam(value = "siteid", required = false) String siteid,
            @RequestParam(value = "storeroom", required = false) String storeroom,
            @RequestParam(value = "pageSize", defaultValue = "50") int pageSize) {
        try {
            return ResponseEntity.ok(new NgApiResponse<>(inventoryCatalog.search(q, siteid, storeroom, pageSize), "ok"));
        } catch (Exception e) {
            log.warn("[PWA-Maximo] inventory search failed: {}", e.getMessage());
            return ResponseEntity.ok(new NgApiResponse<>(List.of(), "Failed: " + e.getMessage()));
        }
    }

    /** Parts checkout: create a WO → approve → issue the material lines → complete. */
    @PostMapping("/parts-checkout")
    public ResponseEntity<NgApiResponse<PartsCheckoutResult>> checkoutParts(@RequestBody PartsCheckoutRequest req) {
        try {
            return ResponseEntity.ok(new NgApiResponse<>(partsCheckout.checkout(req), "checked out"));
        } catch (Exception e) {
            log.warn("[PWA-Maximo] parts checkout failed: {}", e.getMessage());
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Failed: " + e.getMessage()));
        }
    }

    // ── Helpers ────────────────────────────────────────────────────────────────

    /** Maximo personid of the signed-in PWA user (JWT principal → User), or null. */
    private String currentUserPersonid() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) return null;
        Object principal = auth.getPrincipal();
        if (!(principal instanceof CustomUserDetails cud)) return null;
        return userRepo.findById(cud.getId()).map(User::getMaximoPersonid).orElse(null);
    }
}
