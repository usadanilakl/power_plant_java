package com.dk_power.power_plant_java.controller.automation.redtag;

import com.dk_power.power_plant_java.controller.angular.NgApiResponse;
import com.dk_power.power_plant_java.dto.permits.LotoDto;
import com.dk_power.power_plant_java.dto.permits.SafeWorkDto;
import com.dk_power.power_plant_java.sevice.angular.loto.NgLotoService;
import com.dk_power.power_plant_java.sevice.angular.permits.NgSafeWorkService;
import com.dk_power.power_plant_java.sevice.automation.redtag.RedTagLotoAutomationService;
import com.dk_power.power_plant_java.sevice.automation.redtag.RedTagSafeWorkAutomationService;
import com.dk_power.power_plant_java.sevice.automation.redtag.progress.RedTagProgressBroadcaster;
import com.dk_power.power_plant_java.sevice.automation.redtag.session.AutomationSession;
import com.dk_power.power_plant_java.sevice.automation.redtag.tools.SwLabelPatternGenerator;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

/**
 * REST + SSE surface for the rebuilt Red Tag LOTO automation.
 *
 * <p>Lives alongside (does not replace) the legacy {@code /ng/red-tag} and
 * {@code /api/red-tag-progress} endpoints, so the old flow keeps working while
 * this one is verified.
 */
@RestController
@RequestMapping("/ng/red-tag-automation")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@Slf4j
public class RedTagLotoAutomationController {

    private final RedTagLotoAutomationService automationService;
    private final RedTagSafeWorkAutomationService safeWorkAutomationService;
    private final RedTagProgressBroadcaster broadcaster;
    private final NgLotoService lotoService;
    private final NgSafeWorkService safeWorkService;
    private final SwLabelPatternGenerator swLabelPatternGenerator;

    /**
     * Starts an end-to-end LOTO build. Optional {@code fromStep} / {@code toStep}
     * query parameters limit the run to a contiguous range of step indices —
     * steps outside the range are marked SKIPPED. Use them to re-run from a step
     * after a failure, or to run a single step ({@code fromStep == toStep}).
     */
    @PostMapping("/loto/{lotoId}/build")
    public ResponseEntity<NgApiResponse<AutomationSession>> buildLoto(
            @PathVariable Long lotoId,
            @RequestParam(required = false) Integer fromStep,
            @RequestParam(required = false) Integer toStep) {
        try {
            LotoDto loto = lotoService.findDtoById(lotoId)
                    .orElseThrow(() -> new EntityNotFoundException("LOTO not found with id " + lotoId));
            AutomationSession session = automationService.startLotoBuild(loto, fromStep, toStep);
            return ResponseEntity.ok(new NgApiResponse<>(session, "LOTO build started"));
        } catch (Exception e) {
            log.error("[RedTag] Failed to start LOTO build for {}: {}", lotoId, e.getMessage(), e);
            return ResponseEntity.internalServerError()
                    .body(new NgApiResponse<>(null, "Failed to start LOTO build: " + e.getMessage()));
        }
    }

    /**
     * Starts an end-to-end Safe Work permit build. Supports the same optional
     * {@code fromStep} / {@code toStep} query parameters as the LOTO endpoint.
     */
    @PostMapping("/safe-work/{safeWorkId}/build")
    public ResponseEntity<NgApiResponse<AutomationSession>> buildSafeWork(
            @PathVariable Long safeWorkId,
            @RequestParam(required = false) Integer fromStep,
            @RequestParam(required = false) Integer toStep) {
        try {
            SafeWorkDto sw = safeWorkService.getDtoById(safeWorkId);
            if (sw == null) {
                throw new EntityNotFoundException("Safe Work permit not found with id " + safeWorkId);
            }
            AutomationSession session = safeWorkAutomationService.startSafeWorkBuild(sw, fromStep, toStep);
            return ResponseEntity.ok(new NgApiResponse<>(session, "Safe Work build started"));
        } catch (Exception e) {
            log.error("[RedTag] Failed to start Safe Work build for {}: {}", safeWorkId, e.getMessage(), e);
            return ResponseEntity.internalServerError()
                    .body(new NgApiResponse<>(null, "Failed to start Safe Work build: " + e.getMessage()));
        }
    }

    @PostMapping("/pause")
    public ResponseEntity<NgApiResponse<AutomationSession>> pause() {
        return control(automationService::pause, "Build paused");
    }

    @PostMapping("/resume")
    public ResponseEntity<NgApiResponse<AutomationSession>> resume() {
        return control(automationService::resume, "Build resumed");
    }

    @PostMapping("/stop")
    public ResponseEntity<NgApiResponse<AutomationSession>> stop() {
        return control(automationService::stop, "Build stopped");
    }

    @PostMapping("/retry-step")
    public ResponseEntity<NgApiResponse<AutomationSession>> retryStep() {
        return control(automationService::retryStep, "Retrying failed step");
    }

    @PostMapping("/skip-step")
    public ResponseEntity<NgApiResponse<AutomationSession>> skipStep() {
        return control(automationService::skipStep, "Skipped failed step");
    }

    @GetMapping("/status")
    public ResponseEntity<NgApiResponse<AutomationSession>> status() {
        return ResponseEntity.ok(new NgApiResponse<>(automationService.getSession(), "Current session"));
    }

    @PostMapping("/manual-confirmation")
    public ResponseEntity<NgApiResponse<Boolean>> setManualConfirmation(@RequestParam boolean enabled) {
        automationService.setManualConfirmation(enabled);
        return ResponseEntity.ok(new NgApiResponse<>(enabled, "Manual confirmation " + (enabled ? "on" : "off")));
    }

    @GetMapping("/manual-confirmation")
    public ResponseEntity<NgApiResponse<Boolean>> getManualConfirmation() {
        return ResponseEntity.ok(new NgApiResponse<>(automationService.isManualConfirmation(), "Manual confirmation"));
    }

    /** Server-Sent Events stream of live build progress. */
    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter stream() {
        return broadcaster.register();
    }

    /**
     * One-time per-machine generator: OCRs the Safe Work form screenshot and
     * crops a "checkbox + label" PNG per hazard / permit / PPE label, saving
     * to {@code <pattern-base>/safe-work/labels/<key>.png}. Subsequent SW
     * builds use these crops via deterministic image matching — no runtime OCR.
     *
     * <p>Provide a different screenshot via the {@code screenshot} query param
     * if the form layout changes.
     */
    @PostMapping("/admin/generate-sw-label-patterns")
    public ResponseEntity<NgApiResponse<SwLabelPatternGenerator.Result>> generateSwLabelPatterns(
            @RequestParam(required = false) String screenshot) {
        try {
            SwLabelPatternGenerator.Result result = (screenshot == null || screenshot.isBlank())
                    ? swLabelPatternGenerator.generate()
                    : swLabelPatternGenerator.generate(screenshot);
            String msg = String.format("Generated %d label patterns (%d missed) -> %s",
                    result.generated.size(), result.missed.size(), result.outputDir);
            return ResponseEntity.ok(new NgApiResponse<>(result, msg));
        } catch (Exception e) {
            log.error("[RedTag] SW label pattern generation failed: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError()
                    .body(new NgApiResponse<>(null, "Generation failed: " + e.getMessage()));
        }
    }

    private ResponseEntity<NgApiResponse<AutomationSession>> control(
            java.util.function.Supplier<AutomationSession> action, String okMessage) {
        try {
            return ResponseEntity.ok(new NgApiResponse<>(action.get(), okMessage));
        } catch (Exception e) {
            log.warn("[RedTag] Session control failed: {}", e.getMessage());
            return ResponseEntity.internalServerError()
                    .body(new NgApiResponse<>(null, e.getMessage()));
        }
    }
}
