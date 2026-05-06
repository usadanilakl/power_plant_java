package com.dk_power.power_plant_java.controller.angular;

import com.dk_power.power_plant_java.dto.maximo.CreateMaximoServiceRequestDto;
import com.dk_power.power_plant_java.dto.maximo.MaximoAssetDto;
import com.dk_power.power_plant_java.dto.maximo.MaximoDoclinkDto;
import com.dk_power.power_plant_java.dto.maximo.MaximoServiceRequestCriteria;
import com.dk_power.power_plant_java.dto.maximo.MaximoServiceRequestDto;
import com.dk_power.power_plant_java.dto.maximo.MaximoWorkOrderCriteria;
import com.dk_power.power_plant_java.dto.maximo.MaximoWorkOrderDto;
import com.dk_power.power_plant_java.sevice.maximo.MaximoAssetAdapter;
import com.dk_power.power_plant_java.sevice.maximo.MaximoDoclinksAdapter;
import com.dk_power.power_plant_java.sevice.maximo.MaximoServiceRequestAdapter;
import com.dk_power.power_plant_java.sevice.maximo.MaximoWorkOrderAdapter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

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
            @RequestParam(value = "schedstartFrom", required = false) String schedstartFrom,
            @RequestParam(value = "schedfinishTo", required = false) String schedfinishTo,
            @RequestParam(value = "descriptionContains", required = false) String descriptionContains,
            @RequestParam(value = "siteid", required = false) String siteid,
            @RequestParam(value = "pageSize", defaultValue = "50") int pageSize) {
        MaximoWorkOrderCriteria c = new MaximoWorkOrderCriteria();
        c.setStatus(status);
        c.setWorktype(worktype);
        c.setAssetnum(assetnum);
        c.setLocation(location);
        c.setPriority(priority);
        c.setLeadCraft(leadCraft);
        c.setSchedstartFrom(schedstartFrom);
        c.setSchedfinishTo(schedfinishTo);
        c.setDescriptionContains(descriptionContains);
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

    // ---- Attachments (doclinks) ------------------------------------------

    @GetMapping("/{parent}/{href}/attachments")
    public ResponseEntity<NgApiResponse<List<MaximoDoclinkDto>>> listAttachments(
            @PathVariable String parent, @PathVariable String href) {
        return ResponseEntity.ok(new NgApiResponse<>(
                doclinks.list(resolveParent(parent), href), "ok"));
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
