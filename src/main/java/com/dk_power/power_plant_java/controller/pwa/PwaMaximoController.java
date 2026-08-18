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
import com.dk_power.power_plant_java.dto.maximo.ReorderLineDto;
import com.dk_power.power_plant_java.dto.maximo.ReorderResultDto;
import com.dk_power.power_plant_java.sevice.maximo.ChemInventoryReorderService;
import com.dk_power.power_plant_java.sevice.maximo.MaximoBundleService;
import com.dk_power.power_plant_java.sevice.maximo.MaximoDoclinksAdapter;
import com.dk_power.power_plant_java.sevice.maximo.MaximoFormCompletionService;
import com.dk_power.power_plant_java.sevice.maximo.MaximoFormService;
import com.dk_power.power_plant_java.sevice.maximo.MaximoInventoryCatalogService;
import com.dk_power.power_plant_java.sevice.maximo.MaximoLocationAdapter;
import com.dk_power.power_plant_java.sevice.maximo.MaximoPmAuditService;
import com.dk_power.power_plant_java.sevice.maximo.MaximoPartsCheckoutService;
import com.dk_power.power_plant_java.sevice.maximo.MaximoServiceRequestAdapter;
import com.dk_power.power_plant_java.sevice.maximo.MaximoWorkOrderAdapter;
import com.dk_power.power_plant_java.sevice.maximo.MaximoWorklogAdapter;
import com.dk_power.power_plant_java.sevice.maximo.RecurringPmService;
import com.dk_power.power_plant_java.sevice.users.impl.CustomUserDetails;
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
    private final MaximoPmAuditService pmAudit;
    private final ChemInventoryReorderService reorder;
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
            @RequestParam(value = "wonumContains", required = false) String wonumContains,
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
            c.setWonumContains(wonumContains);
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
            @RequestParam("href") String href,
            @RequestParam(value = "doctype", required = false, defaultValue = "Attachments") String doctype,
            @RequestBody AttachmentBody body) {
        try {
            MaximoDoclinkDto created = doclinks.upload("mxapiwodetail", href,
                    body.fileName(), body.contentType(), body.decodeBytes(), doctype);
            return ResponseEntity.ok(new NgApiResponse<>(created, "uploaded"));
        } catch (Exception e) {
            log.warn("[PWA-Maximo] WO attachment upload failed: {}", e.getMessage());
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Attachment failed: " + e.getMessage()));
        }
    }

    /**
     * Base64 file-upload body. The PWA sends attachments as a JSON body (NOT multipart/form-data): iOS Safari
     * intermittently delivers the multipart POST to the hub with the "file" part missing
     * (MissingServletRequestPartException — confirmed in prod), so Maximo never sees the photo. A plain JSON body
     * has no multipart boundary/part to lose in transit, so it arrives intact on iOS the same as on Android.
     */
    public record AttachmentBody(String fileName, String contentType, String dataBase64) {
        /** Decode the base64 payload, tolerating a {@code data:...;base64,} data-URL prefix and MIME whitespace. */
        public byte[] decodeBytes() {
            String b64 = dataBase64 == null ? "" : dataBase64;
            int marker = b64.indexOf("base64,");
            if (marker >= 0) b64 = b64.substring(marker + "base64,".length());
            return java.util.Base64.getMimeDecoder().decode(b64);
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

    /**
     * Edit a service request's description / long description / priority — only while it is still NEW (not yet
     * triaged), matching the phone's attach gate. Blank fields are left unchanged (adapter skips blanks).
     */
    @PostMapping("/service-requests/update")
    public ResponseEntity<NgApiResponse<MaximoServiceRequestDto>> updateSr(
            @RequestParam(value = "href", required = false) String href,
            @RequestParam(value = "hrefHex", required = false) String hrefHex,
            @RequestBody UpdateSrBody body) {
        String h = attachHref(href, hrefHex);   // SR hrefs can contain "--"; the PWA hex-encodes them past the IIS filter
        try {
            MaximoServiceRequestDto current = serviceRequests.findByHref(h).orElse(null);
            if (current == null) return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "SR not found"));
            String status = current.getStatus() == null ? "" : current.getStatus().trim();
            if (!"NEW".equalsIgnoreCase(status)) {
                return ResponseEntity.badRequest().body(
                        new NgApiResponse<>(null, "This request can only be edited while it's NEW (now " + status + ")."));
            }
            java.util.Map<String, String> fields = new java.util.LinkedHashMap<>();
            fields.put("spi:description", body.description());
            fields.put("spi:description_longdescription", body.longDescription());
            fields.put("spi:reportedpriority", body.priority());
            MaximoServiceRequestDto updated = serviceRequests.updateFields(h, fields);
            return ResponseEntity.ok(new NgApiResponse<>(updated, "updated"));
        } catch (Exception e) {
            log.warn("[PWA-Maximo] SR update {} failed: {}", h, e.getMessage());
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    /** Editable SR fields exposed to the phone (blank = unchanged). */
    public record UpdateSrBody(String description, String longDescription, String priority) {}

    /**
     * Resolve an attachment target href from either {@code ?href} (raw) or {@code ?hrefHex} (hex-encoded).
     * The PWA hex-encodes Maximo base64 keys so characters like {@code --} never appear in the URL, where the
     * IIS reverse-proxy request filter rejects them (SQL-comment signature) before the request reaches this app.
     */
    private static String attachHref(String href, String hrefHex) {
        if (hrefHex != null && !hrefHex.isBlank()) {
            return new String(java.util.HexFormat.of().parseHex(hrefHex.trim()), java.nio.charset.StandardCharsets.UTF_8);
        }
        return href;
    }

    /** Attach a photo/file to a service request. Best-effort — caller uploads after create succeeds. */
    @PostMapping("/service-requests/attachment")
    public ResponseEntity<NgApiResponse<MaximoDoclinkDto>> uploadSrAttachment(
            @RequestParam(value = "href", required = false) String href,
            @RequestParam(value = "hrefHex", required = false) String hrefHex,
            @RequestParam(value = "doctype", required = false, defaultValue = "Attachments") String doctype,
            @RequestBody AttachmentBody body) {
        try {
            MaximoDoclinkDto created = doclinks.upload("mxapisr", attachHref(href, hrefHex),
                    body.fileName(), body.contentType(), body.decodeBytes(), doctype);
            return ResponseEntity.ok(new NgApiResponse<>(created, "uploaded"));
        } catch (Exception e) {
            log.warn("[PWA-Maximo] SR attachment upload failed: {}", e.getMessage());
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Attachment failed: " + e.getMessage()));
        }
    }

    /** List a service request's attachments (photos/PDFs/docs). */
    @GetMapping("/service-requests/attachments")
    public ResponseEntity<NgApiResponse<List<MaximoDoclinkDto>>> listSrAttachments(
            @RequestParam(value = "href", required = false) String href,
            @RequestParam(value = "hrefHex", required = false) String hrefHex) {
        try {
            return ResponseEntity.ok(new NgApiResponse<>(doclinks.list("mxapisr", attachHref(href, hrefHex)), "ok"));
        } catch (Exception e) {
            log.warn("[PWA-Maximo] SR attachments list failed: {}", e.getMessage());
            return ResponseEntity.ok(new NgApiResponse<>(List.of(), "Failed: " + e.getMessage()));
        }
    }

    /** Stream one SR attachment's bytes (inline, so the phone can preview an image/PDF). */
    @GetMapping("/service-requests/attachments/content")
    public ResponseEntity<byte[]> srAttachmentContent(
            @RequestParam(value = "href", required = false) String href,
            @RequestParam(value = "hrefHex", required = false) String hrefHex,
            @RequestParam("attachmentId") String attachmentId) {
        ResponseEntity<byte[]> upstream = doclinks.streamBinary("mxapisr", attachHref(href, hrefHex), attachmentId);
        org.springframework.http.HttpHeaders out = new org.springframework.http.HttpHeaders();
        if (upstream.getHeaders().getContentType() != null) out.setContentType(upstream.getHeaders().getContentType());
        long len = upstream.getHeaders().getContentLength();
        if (len > 0) out.setContentLength(len);
        out.set(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION, "inline");
        return new ResponseEntity<>(upstream.getBody(), out, upstream.getStatusCode());
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
     * tracks the lead operators; {@code mode=mine} tracks the signed-in user; {@code mode=custom} tracks the
     * given {@code personids}. {@code pmOnly=true} (default) restricts every bucket to PM work orders.
     */
    @GetMapping("/bundle/overview")
    public ResponseEntity<NgApiResponse<MaximoOverviewDto>> overview(
            @RequestParam(value = "mode", defaultValue = "leads") String mode,
            @RequestParam(value = "personids", required = false) String personids,
            @RequestParam(value = "pmOnly", defaultValue = "true") boolean pmOnly,
            @RequestParam(value = "pageSize", defaultValue = "200") int pageSize) {
        try {
            MaximoOverviewDto ov;
            if ("mine".equalsIgnoreCase(mode)) {
                String pid = currentUserPersonid();
                List<String> ids = (pid == null || pid.isBlank()) ? List.of() : List.of(pid);
                ov = bundles.overview("people", ids, pageSize);
            } else if ("custom".equalsIgnoreCase(mode) || "people".equalsIgnoreCase(mode)) {
                ov = bundles.overview("people", parsePersonids(personids), pageSize);
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

    private static List<String> parsePersonids(String csv) {
        if (csv == null || csv.isBlank()) return List.of();
        return java.util.Arrays.stream(csv.split(",")).map(String::trim).filter(s -> !s.isEmpty()).toList();
    }

    /** Active users that have a Maximo personid — the pool for the "custom" people filter (name + personid). */
    @GetMapping("/labor-people")
    public ResponseEntity<NgApiResponse<List<java.util.Map<String, String>>>> laborPeople() {
        List<java.util.Map<String, String>> people = new java.util.ArrayList<>();
        for (User u : userRepo.findByIsActiveTrue()) {
            String pid = u.getMaximoPersonid();
            if (pid == null || pid.isBlank()) continue;
            String name = (u.getName() != null && !u.getName().isBlank()) ? u.getName() : pid;
            people.add(java.util.Map.of("name", name, "personid", pid));
        }
        people.sort((a, b) -> a.get("name").compareToIgnoreCase(b.get("name")));
        return ResponseEntity.ok(new NgApiResponse<>(people, people.size() + " people"));
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

    /** Existing submissions for a work order (newest first) — lets the phone prefill a form already started on this WO. */
    @GetMapping("/forms/submissions/for-wo")
    public ResponseEntity<NgApiResponse<List<MaximoFormSubmissionDto>>> submissionsForWo(
            @RequestParam("wonum") String wonum) {
        try {
            return ResponseEntity.ok(new NgApiResponse<>(forms.getSubmissionsForWo(wonum), "ok"));
        } catch (Exception e) {
            log.warn("[PWA-Maximo] submissions for-wo failed: {}", e.getMessage());
            return ResponseEntity.ok(new NgApiResponse<>(List.of(), "Failed: " + e.getMessage()));
        }
    }

    /**
     * The newest submission of a form across all work orders — carries settings/values forward into a fresh run
     * (e.g. the chem-inventory target levels + reorder email/config). Null when the form has none yet. Mirrors
     * the desktop so the PWA chem-inventory form prefills the same sticky config instead of opening blank.
     */
    @GetMapping("/forms/submissions/latest-for-form")
    public ResponseEntity<NgApiResponse<MaximoFormSubmissionDto>> latestForForm(
            @RequestParam("formKey") String formKey) {
        try {
            return ResponseEntity.ok(new NgApiResponse<>(forms.getLatestSubmissionForForm(formKey), "ok"));
        } catch (Exception e) {
            log.warn("[PWA-Maximo] latest-for-form failed: {}", e.getMessage());
            return ResponseEntity.ok(new NgApiResponse<>(null, "Failed: " + e.getMessage()));
        }
    }

    /** A PM's previously-completed work orders (COMP / CLOSE), newest first — the phone's per-PM history view. */
    @GetMapping("/pm-completed-history")
    public ResponseEntity<NgApiResponse<List<MaximoWorkOrderDto>>> pmCompletedHistory(
            @RequestParam("pmnum") String pmnum) {
        try {
            return ResponseEntity.ok(new NgApiResponse<>(pmAudit.completedWorkOrdersForPmnum(pmnum), "ok"));
        } catch (Exception e) {
            log.warn("[PWA-Maximo] pm-completed-history {} failed: {}", pmnum, e.getMessage());
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

    /** Dry-run: which reagents on a filled inventory form are below target (need reordering). No email/writes. */
    @PostMapping("/forms/submissions/reorder-preview")
    public ResponseEntity<NgApiResponse<List<ReorderLineDto>>> reorderPreview(@RequestBody MaximoFormSubmissionDto dto) {
        try {
            return ResponseEntity.ok(new NgApiResponse<>(reorder.computeReorder(dto), "ok"));
        } catch (Exception e) {
            log.warn("[PWA-Maximo] reorder-preview failed: {}", e.getMessage());
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    /** Send the vendor reorder email and attach the order summary to the work order (the phone's ordering step). */
    @PostMapping("/forms/submissions/reorder-send")
    public ResponseEntity<NgApiResponse<ReorderResultDto>> reorderSend(@RequestBody MaximoFormSubmissionDto dto) {
        try {
            ReorderResultDto result = reorder.sendReorder(dto);
            return ResponseEntity.ok(new NgApiResponse<>(result, result.isSent() ? "sent" : "not-sent"));
        } catch (Exception e) {
            log.warn("[PWA-Maximo] reorder-send failed: {}", e.getMessage());
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
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
