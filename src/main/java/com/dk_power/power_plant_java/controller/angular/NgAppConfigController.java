package com.dk_power.power_plant_java.controller.angular;

import com.dk_power.power_plant_java.config.SyncConfig;
import com.dk_power.power_plant_java.sevice.angular.permits.NgDailyPermitPackageService;
import com.dk_power.power_plant_java.sevice.angular.permits.NgJobLogService;
import com.dk_power.power_plant_java.sevice.angular.file.NgFileService;
import com.dk_power.power_plant_java.sevice.angular.loto.NgLotoPointService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/ng/config")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class NgAppConfigController {

    private final SyncConfig syncConfig;
    private final NgJobLogService jobLogService;
    private final NgDailyPermitPackageService packageService;
    private final NgFileService fileService;
    private final NgLotoPointService lotoPointService;

    @Value("${test.ui.enabled:false}")
    private boolean testUiEnabled;

    @GetMapping("/test-mode")
    public ResponseEntity<NgApiResponse<Boolean>> isTestMode() {
        return ResponseEntity.ok(new NgApiResponse<>(testUiEnabled, "ok"));
    }

    @GetMapping("/e2e-info")
    public ResponseEntity<NgApiResponse<Map<String, Object>>> getE2eInfo() {
        Map<String, Object> info = new LinkedHashMap<>();
        info.put("isHub", syncConfig.isHubMode());
        info.put("localPort", syncConfig.getSyncPort());
        info.put("syncServerUrl", syncConfig.getSyncServerUrl());
        info.put("machineName", syncConfig.getMachineName());
        info.put("machineId", syncConfig.getMachineId());
        return ResponseEntity.ok(new NgApiResponse<>(info, "ok"));
    }

    /** Public endpoint for E2E sync verification — only active when test.ui.enabled=true */
    @GetMapping("/e2e-verify/job/{id}")
    public ResponseEntity<NgApiResponse<Object>> getJobForVerification(@PathVariable String id) {
        if (!testUiEnabled) {
            return ResponseEntity.status(403).body(new NgApiResponse<>(null, "E2E verification disabled"));
        }
        try {
            var dto = jobLogService.getDtoById(id);
            return ResponseEntity.ok(new NgApiResponse<>(dto, "ok"));
        } catch (Exception e) {
            return ResponseEntity.ok(new NgApiResponse<>(null, "Not found: " + e.getMessage()));
        }
    }

    /** Public endpoint for E2E sync verification — only active when test.ui.enabled=true */
    @GetMapping("/e2e-verify/package/{id}")
    public ResponseEntity<NgApiResponse<Object>> getPackageForVerification(@PathVariable String id) {
        if (!testUiEnabled) {
            return ResponseEntity.status(403).body(new NgApiResponse<>(null, "E2E verification disabled"));
        }
        try {
            var dto = packageService.getDtoById(id);
            return ResponseEntity.ok(new NgApiResponse<>(dto, "ok"));
        } catch (Exception e) {
            return ResponseEntity.ok(new NgApiResponse<>(null, "Not found: " + e.getMessage()));
        }
    }

    @GetMapping("/e2e-verify/file/{id}")
    public ResponseEntity<NgApiResponse<Object>> getFileForVerification(@PathVariable String id) {
        if (!testUiEnabled) {
            return ResponseEntity.status(403).body(new NgApiResponse<>(null, "E2E verification disabled"));
        }
        try {
            var dto = fileService.findDtoById(Long.parseLong(id)).orElse(null);
            return ResponseEntity.ok(new NgApiResponse<>(dto, "ok"));
        } catch (Exception e) {
            return ResponseEntity.ok(new NgApiResponse<>(null, "Not found: " + e.getMessage()));
        }
    }

    @GetMapping("/e2e-verify/loto-point/{id}")
    public ResponseEntity<NgApiResponse<Object>> getLotoPointForVerification(@PathVariable String id) {
        if (!testUiEnabled) {
            return ResponseEntity.status(403).body(new NgApiResponse<>(null, "E2E verification disabled"));
        }
        try {
            var dto = lotoPointService.findDtoById(Long.parseLong(id)).orElse(null);
            return ResponseEntity.ok(new NgApiResponse<>(dto, "ok"));
        } catch (Exception e) {
            return ResponseEntity.ok(new NgApiResponse<>(null, "Not found: " + e.getMessage()));
        }
    }
}
