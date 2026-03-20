package com.dk_power.power_plant_java.controller.pwa;

import com.dk_power.power_plant_java.controller.angular.NgApiResponse;
import com.dk_power.power_plant_java.dto.pwa.PwaRegistrationResult;
import com.dk_power.power_plant_java.dto.pwa.PwaUserRegistrationDto;
import com.dk_power.power_plant_java.sevice.pwa.PwaUserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/pwa/user")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(originPatterns = {"https://dk-power.github.io", "http://localhost:*", "http://127.0.0.1:*"}, allowCredentials = "true")
public class PwaUserController {

    private final PwaUserService pwaUserService;

    @PostMapping("/register")
    public ResponseEntity<NgApiResponse<PwaRegistrationResult>> register(
            @RequestBody PwaUserRegistrationDto dto) {
        try {
            log.info("[PWA User] Registration request: pwaUserUuid={}, email={}", dto.getPwaUserUuid(), dto.getEmail());
            PwaRegistrationResult result = pwaUserService.registerPwaUser(dto);
            return ResponseEntity.ok(new NgApiResponse<>(result, result.getMessage()));
        } catch (Exception e) {
            log.error("[PWA User] Registration failed: {}", e.getMessage(), e);
            return ResponseEntity.badRequest()
                    .body(new NgApiResponse<>(PwaRegistrationResult.error(e.getMessage()), "Registration failed"));
        }
    }

    @GetMapping("/status/{pwaUserUuid}")
    public ResponseEntity<NgApiResponse<Map<String, Object>>> getStatus(
            @PathVariable String pwaUserUuid) {
        try {
            Map<String, Object> status = pwaUserService.getRegistrationStatus(pwaUserUuid);
            if (status == null) {
                return ResponseEntity.ok(new NgApiResponse<>(
                        Map.of("registered", false, "isActive", false),
                        "User not registered"));
            }
            return ResponseEntity.ok(new NgApiResponse<>(status, "Status found"));
        } catch (Exception e) {
            log.error("[PWA User] Status check failed for pwaUserUuid={}: {}", pwaUserUuid, e.getMessage(), e);
            return ResponseEntity.badRequest()
                    .body(new NgApiResponse<>(null, "Status check failed: " + e.getMessage()));
        }
    }
}
