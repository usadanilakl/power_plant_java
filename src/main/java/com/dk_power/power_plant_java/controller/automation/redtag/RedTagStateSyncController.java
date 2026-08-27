package com.dk_power.power_plant_java.controller.automation.redtag;

import com.dk_power.power_plant_java.config.security.RestrictedAllowed;
import com.dk_power.power_plant_java.controller.angular.NgApiResponse;
import com.dk_power.power_plant_java.sevice.automation.redtag.RedTagStateSyncAutomationService;
import com.dk_power.power_plant_java.sevice.automation.redtag.RedTagStateSyncAutomationService.ApplyResult;
import com.dk_power.power_plant_java.sevice.automation.redtag.session.AutomationSession;
import com.dk_power.power_plant_java.sevice.automation.redtag.statesync.DiffPlan;
import com.dk_power.power_plant_java.sevice.automation.redtag.statesync.RedTagScrapeResult;
import com.dk_power.power_plant_java.sevice.automation.redtag.statesync.RedTagStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * REST surface for the Red Tag state-sync flow: kick off a scrape, preview
 * the reconciler's plan, and apply an operator-edited plan.
 *
 * <p>Session control (pause / resume / stop / retry / skip / SSE stream)
 * intentionally goes through the existing
 * {@link RedTagLotoAutomationController} endpoints — the underlying
 * {@link com.dk_power.power_plant_java.sevice.automation.redtag.session.StepEngine}
 * is a singleton, so both surfaces control the same session.
 */
@RestController
@RequestMapping("/ng/red-tag-automation/state-sync")
@RequiredArgsConstructor
@RestrictedAllowed
@Slf4j
public class RedTagStateSyncController {

    private final RedTagStateSyncAutomationService stateSyncService;

    /**
     * Starts a scrape for the requested Red Tag status. Returns the session
     * descriptor immediately — progress streams through the existing SSE
     * endpoint at {@code /ng/red-tag-automation/stream}.
     */
    @PostMapping("/scrape")
    public ResponseEntity<NgApiResponse<AutomationSession>> scrape(@RequestParam("status") String status) {
        try {
            RedTagStatus s = RedTagStatus.parse(status);
            AutomationSession session = stateSyncService.startScrape(s);
            return ResponseEntity.ok(new NgApiResponse<>(session,
                    "Red Tag state sync started for " + s.name()));
        } catch (Exception e) {
            log.error("[RedTag] state-sync scrape failed to start: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError()
                    .body(new NgApiResponse<>(null, "Failed to start scrape: " + e.getMessage()));
        }
    }

    /** Returns the raw scrape output (rows read from Red Tag). May be null if none has run. */
    @GetMapping("/latest-scrape")
    public ResponseEntity<NgApiResponse<RedTagScrapeResult>> latestScrape() {
        return ResponseEntity.ok(new NgApiResponse<>(stateSyncService.getLatestScrape(),
                "Latest scrape result"));
    }

    /** Returns the diff plan built off the latest scrape. Null when no scrape has completed. */
    @GetMapping("/latest-plan")
    public ResponseEntity<NgApiResponse<DiffPlan>> latestPlan() {
        return ResponseEntity.ok(new NgApiResponse<>(stateSyncService.getLatestPlan(),
                "Latest diff plan"));
    }

    /**
     * Recomputes the diff plan against the cached scrape and current local
     * LOTO state. Use when local LOTOs may have changed on other devices
     * between scrape and preview.
     */
    @PostMapping("/rebuild-plan")
    public ResponseEntity<NgApiResponse<DiffPlan>> rebuildPlan() {
        try {
            return ResponseEntity.ok(new NgApiResponse<>(stateSyncService.rebuildPlan(),
                    "Diff plan rebuilt"));
        } catch (Exception e) {
            log.warn("[RedTag] rebuildPlan failed: {}", e.getMessage());
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    /**
     * Applies the operator-edited diff plan. Optional {@code reason} query
     * parameter overrides the default audit reason string. The response carries
     * a per-entry disposition (OK / SKIPPED / FAILED) plus aggregate counts.
     */
    @PostMapping("/apply")
    public ResponseEntity<NgApiResponse<ApplyResult>> apply(
            @RequestBody DiffPlan editedPlan,
            @RequestParam(value = "reason", required = false) String reason) {
        try {
            ApplyResult result = stateSyncService.apply(editedPlan, reason);
            return ResponseEntity.ok(new NgApiResponse<>(result,
                    "Applied " + result.applied() + " / skipped " + result.skipped()
                            + " / failed " + result.failed()));
        } catch (SecurityException se) {
            return ResponseEntity.status(403).body(new NgApiResponse<>(null, se.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        } catch (Exception e) {
            log.error("[RedTag] state-sync apply failed: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError()
                    .body(new NgApiResponse<>(null, "Apply failed: " + e.getMessage()));
        }
    }

    /** Enumerates the statuses the scrape endpoint accepts — for the frontend dropdown. */
    @GetMapping("/statuses")
    public ResponseEntity<NgApiResponse<Map<String, Object>>> statuses() {
        Map<String, Object> map = new java.util.LinkedHashMap<>();
        for (RedTagStatus s : RedTagStatus.values()) {
            Map<String, String> desc = new java.util.LinkedHashMap<>();
            desc.put("localPermitStatus", s.localPermitStatus());
            map.put(s.name(), desc);
        }
        return ResponseEntity.ok(new NgApiResponse<>(map, "Supported statuses"));
    }
}
