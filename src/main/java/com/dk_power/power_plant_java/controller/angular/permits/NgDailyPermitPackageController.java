package com.dk_power.power_plant_java.controller.angular.permits;

import com.dk_power.power_plant_java.controller.angular.NgApiResponse;
import com.dk_power.power_plant_java.dto.automation.AutomationSessionState;
import com.dk_power.power_plant_java.dto.permits.DailyPermitPackageDto;
import com.dk_power.power_plant_java.config.NetworkUtils;
import com.dk_power.power_plant_java.sevice.angular.permits.NgDailyPermitPackageService;
import com.dk_power.power_plant_java.sevice.automation.RedTagStepExecutionService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/ng/daily-permit-packages")
@RequiredArgsConstructor
public class NgDailyPermitPackageController {

    private final NgDailyPermitPackageService ngDailyPermitPackageService;
    private final RedTagStepExecutionService redTagStepExecutionService;

    @com.dk_power.power_plant_java.config.security.RestrictedAllowed // LOTO off-LAN: loto-board data ONLY (rest of this controller stays closed)
    @GetMapping("/loto-board")
    public ResponseEntity<NgApiResponse<List<Map<String, Object>>>> getLotoBoard() {
        try {
            List<Map<String, Object>> lotos = ngDailyPermitPackageService.getActiveLotosForBoard();
            return ResponseEntity.ok(new NgApiResponse<>(lotos, "Active LOTOs retrieved"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Error: " + e.getMessage()));
        }
    }

    @GetMapping("/loto-suggestions/{workAreaId}")
    public ResponseEntity<NgApiResponse<Map<String, Object>>> getLotoSuggestions(@PathVariable Long workAreaId) {
        try {
            Map<String, Object> suggestions = ngDailyPermitPackageService.getLotoSuggestionsForWorkArea(workAreaId);
            return ResponseEntity.ok(new NgApiResponse<>(suggestions, "LOTO suggestions retrieved"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Error: " + e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<NgApiResponse<List<DailyPermitPackageDto>>> getAllDailyPermitPackages() {
        try {
            List<DailyPermitPackageDto> packages = ngDailyPermitPackageService.getAllDtos();
            NgApiResponse<List<DailyPermitPackageDto>> response = new NgApiResponse<>(packages, "Daily permit packages retrieved successfully", LocalDateTime.now());
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Error retrieving daily permit packages: " + e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<NgApiResponse<DailyPermitPackageDto>> getDailyPermitPackageById(@PathVariable String id) {
        try {
            DailyPermitPackageDto permitPackage = ngDailyPermitPackageService.getDtoById(id);
            if (permitPackage == null) {
                return ResponseEntity.notFound().build();
            }
            NgApiResponse<DailyPermitPackageDto> response = new NgApiResponse<>(permitPackage, "Daily permit package retrieved successfully", LocalDateTime.now());
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Error retrieving daily permit package: " + e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<NgApiResponse<DailyPermitPackageDto>> createDailyPermitPackage(@RequestBody DailyPermitPackageDto permitPackageDto) {
        try {
            DailyPermitPackageDto createdPackage = ngDailyPermitPackageService.createDailyPermitPackage(permitPackageDto);
            NgApiResponse<DailyPermitPackageDto> response = new NgApiResponse<>(createdPackage, "Daily permit package created successfully", LocalDateTime.now());
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Error creating daily permit package: " + e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<NgApiResponse<DailyPermitPackageDto>> updateDailyPermitPackage(@PathVariable String id, @RequestBody DailyPermitPackageDto permitPackageDto) {
        try {
            DailyPermitPackageDto updatedPackage = ngDailyPermitPackageService.updateDailyPermitPackage(id, permitPackageDto);
            NgApiResponse<DailyPermitPackageDto> response = new NgApiResponse<>(updatedPackage, "Daily permit package updated successfully", LocalDateTime.now());
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Error updating daily permit package: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<NgApiResponse<String>> deleteDailyPermitPackage(@PathVariable String id) {
        try {
            ngDailyPermitPackageService.softDelete(id);
            NgApiResponse<String> response = new NgApiResponse<>("Deleted", "Daily permit package deleted successfully", LocalDateTime.now());
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Error deleting daily permit package: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{packageId}/permits/{permitType}/{permitId}")
    public ResponseEntity<NgApiResponse<DailyPermitPackageDto>> removePermitFromPackage(
            @PathVariable String packageId,
            @PathVariable String permitType,
            @PathVariable String permitId) {
        try {
            DailyPermitPackageDto updatedPackage = ngDailyPermitPackageService.removePermitFromPackage(packageId, permitType, permitId);
            NgApiResponse<DailyPermitPackageDto> response = new NgApiResponse<>(
                    updatedPackage,
                    "Permit removed from package successfully",
                    LocalDateTime.now()
            );
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Error removing permit from package: " + e.getMessage()));
        }
    }

    @PostMapping("/build-permits")
    public ResponseEntity<NgApiResponse<String>> buildPermits(@RequestBody DailyPermitPackageDto dailyPermitPackageDto) {
        try {
            String result = ngDailyPermitPackageService.buildPermits(dailyPermitPackageDto);
            NgApiResponse<String> response = new NgApiResponse<>(result, "Permits built successfully", LocalDateTime.now());
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Error building permits: " + e.getMessage()));
        }
    }

    @GetMapping("/build-permits/{id}/{whatToBuild}/{permitId}")
    public ResponseEntity<NgApiResponse<String>> buildPermitsById(@PathVariable String id, @PathVariable String whatToBuild, @PathVariable String permitId) {
        try {
            String result = ngDailyPermitPackageService.buildPermitsById(id, whatToBuild, permitId);
            NgApiResponse<String> response = new NgApiResponse<>(result, "Permits built successfully", LocalDateTime.now());
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Error building permits: " + e.getMessage()));
        }
    }

    @PostMapping("/reissue-permits-from/{packageIdToReissue}/to/{targetPackageId}")
    public ResponseEntity<NgApiResponse<DailyPermitPackageDto>> reissuePermits(
            @PathVariable String packageIdToReissue,
            @PathVariable String targetPackageId,
            @RequestBody(required = false) Map<String, String> body) {
        try {
            String date = body != null ? body.get("date") : null;
            String time = body != null ? body.get("time") : null;
            DailyPermitPackageDto dailyPermitPackageDto = ngDailyPermitPackageService.reissuePermits(packageIdToReissue, targetPackageId, date, time);
            NgApiResponse<DailyPermitPackageDto> response = new NgApiResponse<>(dailyPermitPackageDto, "Permits reissued successfully", LocalDateTime.now());
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Error reissuing permits: " + e.getMessage()));
        }
    }

    @PostMapping("/reissue-from/{sourceId}/for-wr/{wrId}")
    public ResponseEntity<NgApiResponse<DailyPermitPackageDto>> reissueFromPackageForWorkRequest(
            @PathVariable Long sourceId,
            @PathVariable Long wrId,
            @RequestBody(required = false) Map<String, String> body) {
        try {
            String date = body != null ? body.get("date") : null;
            String time = body != null ? body.get("time") : null;
            DailyPermitPackageDto result = ngDailyPermitPackageService.reissueFromPackageForWorkRequest(sourceId, wrId, date, time);
            return ResponseEntity.ok(new NgApiResponse<>(result, "Package reissued from source for work request"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Error: " + e.getMessage()));
        }
    }

    @PostMapping("/{sourceId}/reissue")
    public ResponseEntity<NgApiResponse<DailyPermitPackageDto>> reissuePackageToNewPackage(
            @PathVariable Long sourceId,
            @RequestBody(required = false) Map<String, String> body) {
        try {
            String date = body != null ? body.get("date") : null;
            String time = body != null ? body.get("time") : null;
            boolean skipWorkRequests = body != null && "true".equals(body.get("skipWorkRequests"));
            DailyPermitPackageDto result = ngDailyPermitPackageService.reissuePackageToNewPackage(sourceId, date, time, skipWorkRequests);
            return ResponseEntity.ok(new NgApiResponse<>(result, "Package reissued successfully"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Error: " + e.getMessage()));
        }
    }

    @GetMapping("/search")
    public ResponseEntity<NgApiResponse<List<DailyPermitPackageDto>>> searchPackages(
            @RequestParam(required = false) String scope,
            @RequestParam(required = false) String date,
            @RequestParam(required = false) String location) {
        try {
            List<DailyPermitPackageDto> results = ngDailyPermitPackageService.searchPackages(scope, date, location);
            return ResponseEntity.ok(new NgApiResponse<>(results, "Search results"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Error: " + e.getMessage()));
        }
    }

    @PostMapping("/reissue-permits-by-work-request-id/{wrId}/")
    public ResponseEntity<NgApiResponse<DailyPermitPackageDto>> reissuePermitsByWorkRequestId(@PathVariable String wrId) {
        try {
            DailyPermitPackageDto dailyPermitPackageDto = ngDailyPermitPackageService.reissuePermitsByWorkRequestId(wrId);
            NgApiResponse<DailyPermitPackageDto> response = new NgApiResponse<>(dailyPermitPackageDto, "Permits reissued successfully", LocalDateTime.now());
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Error reissuing permits: " + e.getMessage()));
        }
    }

    @PostMapping("/{id}/activate")
    public ResponseEntity<NgApiResponse<DailyPermitPackageDto>> activatePackage(@PathVariable String id) {
        try {
            DailyPermitPackageDto result = ngDailyPermitPackageService.activatePackage(id);
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON)
                .body(new NgApiResponse<>(result, "Package activated", LocalDateTime.now()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Error: " + e.getMessage()));
        }
    }

    @PostMapping("/{id}/test")
    public ResponseEntity<NgApiResponse<DailyPermitPackageDto>> putPackageUnderTest(@PathVariable String id) {
        try {
            DailyPermitPackageDto result = ngDailyPermitPackageService.putPackageUnderTest(id);
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON)
                .body(new NgApiResponse<>(result, "Package under test", LocalDateTime.now()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Error: " + e.getMessage()));
        }
    }

    @PostMapping("/{id}/close")
    public ResponseEntity<NgApiResponse<DailyPermitPackageDto>> closePackage(
            @PathVariable String id,
            @RequestBody(required = false) Map<String, Object> closureData) {
        try {
            DailyPermitPackageDto result = ngDailyPermitPackageService.closePackage(id, closureData);
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON)
                .body(new NgApiResponse<>(result, "Package closed", LocalDateTime.now()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Error: " + e.getMessage()));
        }
    }

    @PostMapping("/{id}/apply-date-time")
    public ResponseEntity<NgApiResponse<DailyPermitPackageDto>> applyDateTimeToPackagePermits(
            @PathVariable String id,
            @RequestBody Map<String, String> payload) {
        try {
            DailyPermitPackageDto result = ngDailyPermitPackageService.applyDateTimeToPackagePermits(
                    id,
                    payload.get("date"),
                    payload.get("time")
            );
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON)
                    .body(new NgApiResponse<>(result, "Date and time applied to package permits", LocalDateTime.now()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Error: " + e.getMessage()));
        }
    }

    // --- Personnel Sign-On/Off ---

    @PostMapping("/{id}/foreman-sign-on")
    public ResponseEntity<?> foremanSignOn(
            @PathVariable String id,
            @RequestBody Map<String, String> body,
            HttpServletRequest request) {
        if (!NetworkUtils.isLoopbackRequest(request)) {
            return ResponseEntity.status(403).body(Map.of(
                    "error", "LOCALHOST_REQUIRED",
                    "message", "Foreman sign-on is only available from the control room desktop"
            ));
        }
        try {
            DailyPermitPackageDto result = ngDailyPermitPackageService.foremanSignOn(
                    id, body.get("personName"), body.get("company"));
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON)
                    .body(new NgApiResponse<>(result, "Foreman signed on", LocalDateTime.now()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Error: " + e.getMessage()));
        }
    }

    @PostMapping("/{id}/foreman-sign-off")
    public ResponseEntity<?> foremanSignOff(
            @PathVariable String id,
            @RequestBody Map<String, Object> closeOutData,
            HttpServletRequest request) {
        if (!NetworkUtils.isLoopbackRequest(request)) {
            return ResponseEntity.status(403).body(Map.of(
                    "error", "LOCALHOST_REQUIRED",
                    "message", "Foreman sign-off is only available from the control room desktop"
            ));
        }
        try {
            DailyPermitPackageDto result = ngDailyPermitPackageService.foremanSignOff(id, closeOutData);
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON)
                    .body(new NgApiResponse<>(result, "Foreman close-out completed", LocalDateTime.now()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Error: " + e.getMessage()));
        }
    }

    @PostMapping("/{id}/sign-on")
    public ResponseEntity<NgApiResponse<DailyPermitPackageDto>> signOn(
            @PathVariable String id,
            @RequestBody Map<String, String> body) {
        try {
            DailyPermitPackageDto result = ngDailyPermitPackageService.signOnPerson(
                    id, body.get("personName"), body.get("personRole"), body.get("company"));
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON)
                    .body(new NgApiResponse<>(result, "Person signed on", LocalDateTime.now()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Error: " + e.getMessage()));
        }
    }

    @PostMapping("/{id}/sign-off")
    public ResponseEntity<NgApiResponse<DailyPermitPackageDto>> signOff(
            @PathVariable String id,
            @RequestBody Map<String, String> body) {
        try {
            DailyPermitPackageDto result = ngDailyPermitPackageService.signOffPerson(
                    id, body.get("personName"), body.get("comments"));
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON)
                    .body(new NgApiResponse<>(result, "Person signed off", LocalDateTime.now()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Error: " + e.getMessage()));
        }
    }

    @PostMapping("/{id}/generate-continuation")
    public ResponseEntity<NgApiResponse<DailyPermitPackageDto>> generateContinuation(@PathVariable String id) {
        try {
            DailyPermitPackageDto result = ngDailyPermitPackageService.generateContinuationFromCloseOut(id);
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON)
                    .body(new NgApiResponse<>(result, "Continuation package generated", LocalDateTime.now()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Error: " + e.getMessage()));
        }
    }

    // --- Red Tag Automation Control Endpoints ---

    @PostMapping("/automation/start/{id}")
    public ResponseEntity<NgApiResponse<AutomationSessionState>> automationStart(@PathVariable String id) {
        try {
            DailyPermitPackageDto dto = ngDailyPermitPackageService.getDtoById(id);
            AutomationSessionState state = redTagStepExecutionService.startBuild(dto);
            return ResponseEntity.ok(new NgApiResponse<>(state, "Build started", LocalDateTime.now()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Error: " + e.getMessage()));
        }
    }

    @PostMapping("/automation/pause")
    public ResponseEntity<NgApiResponse<AutomationSessionState>> automationPause() {
        try {
            AutomationSessionState state = redTagStepExecutionService.pauseBuild();
            return ResponseEntity.ok(new NgApiResponse<>(state, "Build paused", LocalDateTime.now()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Error: " + e.getMessage()));
        }
    }

    @PostMapping("/automation/resume")
    public ResponseEntity<NgApiResponse<AutomationSessionState>> automationResume() {
        try {
            AutomationSessionState state = redTagStepExecutionService.resumeBuild();
            return ResponseEntity.ok(new NgApiResponse<>(state, "Build resumed", LocalDateTime.now()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Error: " + e.getMessage()));
        }
    }

    @PostMapping("/automation/stop")
    public ResponseEntity<NgApiResponse<AutomationSessionState>> automationStop() {
        try {
            AutomationSessionState state = redTagStepExecutionService.stopBuild();
            return ResponseEntity.ok(new NgApiResponse<>(state, "Build stopped", LocalDateTime.now()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Error: " + e.getMessage()));
        }
    }

    @PostMapping("/automation/retry-step")
    public ResponseEntity<NgApiResponse<AutomationSessionState>> automationRetryStep() {
        try {
            AutomationSessionState state = redTagStepExecutionService.retryStep();
            return ResponseEntity.ok(new NgApiResponse<>(state, "Retrying step", LocalDateTime.now()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Error: " + e.getMessage()));
        }
    }

    @PostMapping("/automation/skip-step")
    public ResponseEntity<NgApiResponse<AutomationSessionState>> automationSkipStep() {
        try {
            AutomationSessionState state = redTagStepExecutionService.skipStep();
            return ResponseEntity.ok(new NgApiResponse<>(state, "Step skipped", LocalDateTime.now()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "Error: " + e.getMessage()));
        }
    }

    @PostMapping("/automation/manual-confirmation")
    public ResponseEntity<NgApiResponse<Boolean>> automationManualConfirmation(@RequestParam boolean enabled) {
        redTagStepExecutionService.setManualConfirmation(enabled);
        return ResponseEntity.ok(new NgApiResponse<>(enabled, "Manual confirmation " + (enabled ? "enabled" : "disabled"), LocalDateTime.now()));
    }

    @GetMapping("/automation/manual-confirmation")
    public ResponseEntity<NgApiResponse<Boolean>> getManualConfirmation() {
        return ResponseEntity.ok(new NgApiResponse<>(redTagStepExecutionService.isManualConfirmation(), "Manual confirmation status", LocalDateTime.now()));
    }

    @GetMapping("/automation/status")
    public ResponseEntity<NgApiResponse<AutomationSessionState>> automationStatus() {
        AutomationSessionState state = redTagStepExecutionService.getSessionState();
        return ResponseEntity.ok(new NgApiResponse<>(state, "Current status", LocalDateTime.now()));
    }
}
