package com.dk_power.power_plant_java.controller.pwa;

import com.dk_power.power_plant_java.controller.angular.NgApiResponse;
import com.dk_power.power_plant_java.dto.pwa.PwaRegistrationResult;
import com.dk_power.power_plant_java.dto.pwa.PwaUserRegistrationDto;
import com.dk_power.power_plant_java.entities.users.User;
import com.dk_power.power_plant_java.repository.users.UserRepo;
import com.dk_power.power_plant_java.sevice.pwa.PwaUserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Base64;
import java.util.Map;

@RestController
@RequestMapping("/api/pwa/user")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(originPatterns = {"https://dk-power.github.io", "https://jacksongeneration.github.io", "http://localhost:*", "http://127.0.0.1:*"}, allowCredentials = "true")
public class PwaUserController {

    private final PwaUserService pwaUserService;
    private final UserRepo userRepo;

    private static final Path SIGNATURES_DIR = Paths.get("data", "signatures");

    @PostMapping("/register")
    public ResponseEntity<NgApiResponse<PwaRegistrationResult>> register(
            @RequestBody PwaUserRegistrationDto dto) {
        try {
            log.info("[PWA User] Registration request: pwaUserUuid={}, email={}", dto.getPwaUserUuid(), dto.getEmail());
            PwaRegistrationResult result = pwaUserService.registerPwaUser(dto);
            return ResponseEntity.ok(new NgApiResponse<>(result, result.getMessage()));
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            // A UNIQUE index rejected the row. The service pre-checks the ones it can, so reaching
            // here means a concurrent registration or a column it doesn't guard — either way the
            // user needs a sentence, not a Hibernate batch dump.
            log.warn("[PWA User] Registration rejected by a unique constraint: email={} pwaUserUuid={} cause={}",
                    dto.getEmail(), dto.getPwaUserUuid(), rootMessage(e));
            return ResponseEntity.badRequest().body(new NgApiResponse<>(
                    PwaRegistrationResult.error("This account could not be created — some of these details are "
                            + "already registered. Try signing in, or use a different email."),
                    "Registration failed"));
        } catch (Exception e) {
            log.error("[PWA User] Registration failed: {}", e.getMessage(), e);
            return ResponseEntity.badRequest()
                    .body(new NgApiResponse<>(PwaRegistrationResult.error(e.getMessage()), "Registration failed"));
        }
    }

    /** Innermost cause message — the outer Spring/Hibernate wrappers repeat the whole SQL statement. */
    private static String rootMessage(Throwable t) {
        Throwable root = t;
        while (root.getCause() != null && root.getCause() != root) root = root.getCause();
        String message = root.getMessage();
        if (message == null) return root.getClass().getSimpleName();
        int newline = message.indexOf('\n');
        return newline > 0 ? message.substring(0, newline) : message;
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

    @PostMapping("/signature/{pwaUserUuid}")
    public ResponseEntity<?> uploadSignature(@PathVariable String pwaUserUuid,
                                             @RequestBody Map<String, String> body) {
        String base64Data = body.get("signature");
        if (base64Data == null || base64Data.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "MISSING_DATA"));
        }

        User user = userRepo.findFirstByPwaUserUuidOrderByIdAsc(pwaUserUuid);
        if (user == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "USER_NOT_FOUND"));
        }

        try {
            Files.createDirectories(SIGNATURES_DIR);

            String rawBase64 = base64Data;
            if (rawBase64.contains(",")) {
                rawBase64 = rawBase64.substring(rawBase64.indexOf(",") + 1);
            }

            byte[] imageBytes = Base64.getDecoder().decode(rawBase64);
            String fileName = user.getId() + ".png";
            Path filePath = SIGNATURES_DIR.resolve(fileName);
            Files.write(filePath, imageBytes);

            user.setSignaturePath(filePath.toString());
            userRepo.save(user);

            log.info("[PWA User] Saved signature for pwaUserUuid={}", pwaUserUuid);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (IOException e) {
            log.error("[PWA User] Failed to save signature: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of("error", "SAVE_FAILED"));
        }
    }
}
