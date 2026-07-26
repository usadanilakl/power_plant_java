package com.dk_power.power_plant_java.controller.pwa;

import com.dk_power.power_plant_java.controller.angular.NgApiResponse;
import com.dk_power.power_plant_java.dto.field_list.FieldListItemDto;
import com.dk_power.power_plant_java.entities.users.User;
import com.dk_power.power_plant_java.enums.PermissionLevel;
import com.dk_power.power_plant_java.repository.users.UserRepo;
import com.dk_power.power_plant_java.sevice.angular.field_list.NgFieldListItemService;
import com.dk_power.power_plant_java.sevice.pwa.PwaNotificationService;
import com.dk_power.power_plant_java.sevice.pwa.PwaPermitService;
import com.dk_power.power_plant_java.sevice.users.impl.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/pwa/secured")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(originPatterns = {"https://dk-power.github.io", "https://jacksongeneration.github.io", "http://localhost:*", "http://127.0.0.1:*"}, allowCredentials = "true")
public class PwaSecuredController {

    private final PwaPermitService pwaPermitService;
    private final PwaNotificationService pwaNotificationService;
    private final NgFieldListItemService fieldListItemService;
    private final com.dk_power.power_plant_java.sevice.angular.inventory.NgInventoryItemService inventoryItemService;
    private final UserRepo userRepo;
    private final PasswordEncoder passwordEncoder;
    private final com.dk_power.power_plant_java.sevice.auth.SyncAtLoginService syncAtLoginService;

    @GetMapping("/my-permits")
    public ResponseEntity<?> getMyPermits() {
        User user = getCurrentUser();
        if (user == null) return ResponseEntity.status(401).body(Map.of("error", "NOT_AUTHENTICATED"));

        if (!PermissionLevel.canViewPermits(user.getPermissionLevel())) {
            return ResponseEntity.status(403).body(Map.of(
                    "error", "INSUFFICIENT_PERMISSION",
                    "message", "Requires BASIC or higher permission level"));
        }

        List<Map<String, Object>> permits = pwaPermitService.getPermitsForUser(user);
        return ResponseEntity.ok(Map.of("permits", permits));
    }

    @GetMapping("/my-permits/{id}")
    public ResponseEntity<?> getPermitDetail(@PathVariable Long id) {
        User user = getCurrentUser();
        if (user == null) return ResponseEntity.status(401).body(Map.of("error", "NOT_AUTHENTICATED"));

        if (!PermissionLevel.canViewPermits(user.getPermissionLevel())) {
            return ResponseEntity.status(403).body(Map.of(
                    "error", "INSUFFICIENT_PERMISSION",
                    "message", "Requires BASIC or higher permission level"));
        }

        Map<String, Object> detail = pwaPermitService.getPermitDetail(id, user);
        if (detail == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(detail);
    }

    @PostMapping("/permits/{id}/sign-on")
    public ResponseEntity<?> signOn(@PathVariable Long id) {
        User user = getCurrentUser();
        if (user == null) return ResponseEntity.status(401).body(Map.of("error", "NOT_AUTHENTICATED"));

        if (!PermissionLevel.canSignPermits(user.getPermissionLevel())) {
            return ResponseEntity.status(403).body(Map.of(
                    "error", "INSUFFICIENT_PERMISSION",
                    "message", "Requires OPERATOR permission level"));
        }

        Map<String, Object> result = pwaPermitService.signOn(id, user);
        if (result.containsKey("error")) {
            return ResponseEntity.badRequest().body(result);
        }
        return ResponseEntity.ok(result);
    }

    @PostMapping("/permits/{id}/sign-off")
    public ResponseEntity<?> signOff(@PathVariable Long id,
                                     @RequestBody(required = false) Map<String, String> body) {
        User user = getCurrentUser();
        if (user == null) return ResponseEntity.status(401).body(Map.of("error", "NOT_AUTHENTICATED"));

        if (!PermissionLevel.canSignPermits(user.getPermissionLevel())) {
            return ResponseEntity.status(403).body(Map.of(
                    "error", "INSUFFICIENT_PERMISSION",
                    "message", "Requires OPERATOR permission level"));
        }

        String comments = body != null ? body.get("comments") : null;
        Map<String, Object> result = pwaPermitService.signOff(id, user, comments);
        if (result.containsKey("error")) {
            return ResponseEntity.badRequest().body(result);
        }
        return ResponseEntity.ok(result);
    }

    // ============ Notifications ============

    @GetMapping("/notifications")
    public ResponseEntity<?> getNotifications() {
        User user = getCurrentUser();
        if (user == null) return ResponseEntity.status(401).body(Map.of("error", "NOT_AUTHENTICATED"));

        if (!PermissionLevel.canViewPermits(user.getPermissionLevel())) {
            return ResponseEntity.status(403).body(Map.of(
                    "error", "INSUFFICIENT_PERMISSION",
                    "message", "Requires BASIC or higher permission level"));
        }

        Map<String, Object> notifications = pwaNotificationService.getNotifications(user);
        return ResponseEntity.ok(notifications);
    }

    @PostMapping("/notifications/mark-read")
    public ResponseEntity<?> markNotificationsRead() {
        User user = getCurrentUser();
        if (user == null) return ResponseEntity.status(401).body(Map.of("error", "NOT_AUTHENTICATED"));

        if (!PermissionLevel.canViewPermits(user.getPermissionLevel())) {
            return ResponseEntity.status(403).body(Map.of(
                    "error", "INSUFFICIENT_PERMISSION",
                    "message", "Requires BASIC or higher permission level"));
        }

        pwaNotificationService.markAsRead(user);
        return ResponseEntity.ok(Map.of("success", true));
    }

    // ============ Profile ============

    @GetMapping("/profile")
    public ResponseEntity<?> getProfile() {
        User user = getCurrentUser();
        if (user == null) return ResponseEntity.status(401).body(Map.of("error", "NOT_AUTHENTICATED"));

        Map<String, Object> profile = new LinkedHashMap<>();
        profile.put("id", user.getId());
        profile.put("name", user.getName());
        profile.put("email", user.getEmail());
        profile.put("phone", user.getPhone());
        profile.put("company", user.getCompany());
        profile.put("roles", user.getRoles());
        profile.put("permissionLevel", user.getPermissionLevel() != null ? user.getPermissionLevel() : "NONE");
        profile.put("isActive", Boolean.TRUE.equals(user.getIsActive()));
        profile.put("hasSignature", user.getSignaturePath() != null);
        return ResponseEntity.ok(profile);
    }

    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(@RequestBody Map<String, String> body) {
        User user = getCurrentUser();
        if (user == null) return ResponseEntity.status(401).body(Map.of("error", "NOT_AUTHENTICATED"));

        try {
            if (body.containsKey("name")) {
                user.setName(body.get("name"));
                // Update firstName/lastName from name
                String name = body.get("name");
                int spaceIdx = name.indexOf(' ');
                if (spaceIdx > 0) {
                    user.setFirstName(name.substring(0, spaceIdx));
                    user.setLastName(name.substring(spaceIdx + 1));
                } else {
                    user.setFirstName(name);
                    user.setLastName("");
                }
            }
            if (body.containsKey("email")) {
                String newEmail = body.get("email");
                if (!newEmail.equals(user.getEmail()) && userRepo.existsByEmail(newEmail)) {
                    return ResponseEntity.badRequest().body(Map.of(
                            "error", "EMAIL_TAKEN", "message", "This email is already in use"));
                }
                user.setEmail(newEmail);
                user.setUsername(newEmail);
            }
            if (body.containsKey("phone")) user.setPhone(body.get("phone"));
            if (body.containsKey("company")) user.setCompany(body.get("company"));

            userRepo.save(user);
            log.info("[PWA Profile] Updated profile for user: {}", user.getEmail());
            return ResponseEntity.ok(Map.of("success", true, "message", "Profile updated"));
        } catch (Exception e) {
            log.error("[PWA Profile] Update failed: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("error", "UPDATE_FAILED", "message", e.getMessage()));
        }
    }

    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(@RequestBody Map<String, String> body) {
        User user = getCurrentUser();
        if (user == null) return ResponseEntity.status(401).body(Map.of("error", "NOT_AUTHENTICATED"));

        String currentPassword = body.get("currentPassword");
        String newPassword = body.get("newPassword");

        if (newPassword == null || newPassword.length() < 8) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "INVALID_PASSWORD", "message", "New password must be at least 8 characters"));
        }

        // Verify current password
        if (currentPassword == null || !passwordEncoder.matches(currentPassword, user.getPassword())) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "WRONG_PASSWORD", "message", "Current password is incorrect"));
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        user.setPasswordUpdatedAt(java.time.LocalDateTime.now(java.time.ZoneOffset.UTC));
        userRepo.save(user);
        // Fire-and-forget mirror to Supabase; reconciliation catches up if it's down.
        syncAtLoginService.mirrorPasswordChangeAsync(user.getId(), newPassword);
        log.info("[PWA Profile] Password changed for user: {}", user.getEmail());
        return ResponseEntity.ok(Map.of("success", true, "message", "Password changed successfully"));
    }

    // ============ Signature (file-based) ============

    private static final Path SIGNATURES_DIR = Paths.get("data", "signatures");

    @PostMapping("/signature")
    public ResponseEntity<?> uploadSignature(@RequestBody Map<String, String> body) {
        User user = getCurrentUser();
        if (user == null) return ResponseEntity.status(401).body(Map.of("error", "NOT_AUTHENTICATED"));

        String base64Data = body.get("signature");
        if (base64Data == null || base64Data.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "MISSING_DATA", "message", "No signature data provided"));
        }

        try {
            Files.createDirectories(SIGNATURES_DIR);

            // Strip data URL prefix if present (e.g. "data:image/png;base64,...")
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

            log.info("[PWA Signature] Saved signature for user: {}", user.getEmail());
            return ResponseEntity.ok(Map.of("success", true, "message", "Signature saved"));
        } catch (IOException e) {
            log.error("[PWA Signature] Failed to save signature: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of("error", "SAVE_FAILED", "message", "Failed to save signature file"));
        }
    }

    @GetMapping("/signature")
    public ResponseEntity<?> getSignature() {
        User user = getCurrentUser();
        if (user == null) return ResponseEntity.status(401).body(Map.of("error", "NOT_AUTHENTICATED"));

        if (user.getSignaturePath() == null) {
            return ResponseEntity.ok(Map.of("hasSignature", false));
        }

        try {
            Path filePath = Paths.get(user.getSignaturePath());
            if (!Files.exists(filePath)) {
                return ResponseEntity.ok(Map.of("hasSignature", false));
            }

            byte[] imageBytes = Files.readAllBytes(filePath);
            String base64 = "data:image/png;base64," + Base64.getEncoder().encodeToString(imageBytes);
            return ResponseEntity.ok(Map.of("hasSignature", true, "signature", base64));
        } catch (IOException e) {
            log.error("[PWA Signature] Failed to read signature: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of("error", "READ_FAILED", "message", "Failed to read signature file"));
        }
    }

    @GetMapping(value = "/signature/image", produces = MediaType.IMAGE_PNG_VALUE)
    public ResponseEntity<byte[]> getSignatureImage() {
        User user = getCurrentUser();
        if (user == null) return ResponseEntity.status(401).build();

        if (user.getSignaturePath() == null) return ResponseEntity.notFound().build();

        try {
            Path filePath = Paths.get(user.getSignaturePath());
            if (!Files.exists(filePath)) return ResponseEntity.notFound().build();

            byte[] imageBytes = Files.readAllBytes(filePath);
            return ResponseEntity.ok()
                    .contentType(MediaType.IMAGE_PNG)
                    .body(imageBytes);
        } catch (IOException e) {
            log.error("[PWA Signature] Failed to serve signature image: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    // ============ Field Lists ============

    @GetMapping("/field-list/open-items")
    public ResponseEntity<NgApiResponse<List<FieldListItemDto>>> getOpenFieldListItems(
            @RequestParam(required = false) String listType) {
        User user = getCurrentUser();
        if (user == null) return ResponseEntity.status(401).body(
                new NgApiResponse<>(null, "NOT_AUTHENTICATED"));

        List<FieldListItemDto> items;
        if (listType != null && !listType.isBlank()) {
            items = fieldListItemService.getOpenItemsByListType(listType);
        } else {
            items = fieldListItemService.getOpenItems();
        }
        return ResponseEntity.ok(new NgApiResponse<>(items, "Open items retrieved"));
    }

    // ============ Inventory ============

    @GetMapping("/inventory/active-items")
    public ResponseEntity<NgApiResponse<List<com.dk_power.power_plant_java.dto.inventory.InventoryItemDto>>> getActiveInventoryItems(
            @RequestParam(required = false) String type) {
        User user = getCurrentUser();
        if (user == null) return ResponseEntity.status(401).body(
                new NgApiResponse<>(null, "NOT_AUTHENTICATED"));

        List<com.dk_power.power_plant_java.dto.inventory.InventoryItemDto> items;
        if (type != null && !type.isBlank()) {
            items = inventoryItemService.getActiveItemsByType(type);
        } else {
            items = inventoryItemService.getActiveItems();
        }
        return ResponseEntity.ok(new NgApiResponse<>(items, "Active inventory items retrieved"));
    }

    @GetMapping("/inventory/by-qr/{qrToken}")
    public ResponseEntity<NgApiResponse<com.dk_power.power_plant_java.dto.inventory.InventoryItemDto>> getInventoryByQr(
            @PathVariable String qrToken) {
        User user = getCurrentUser();
        if (user == null) return ResponseEntity.status(401).body(
                new NgApiResponse<>(null, "NOT_AUTHENTICATED"));

        com.dk_power.power_plant_java.dto.inventory.InventoryItemDto dto = inventoryItemService.getDtoByQrToken(qrToken);
        if (dto == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(new NgApiResponse<>(dto, "Found"));
    }

    @GetMapping("/inventory/{id}/usage")
    public ResponseEntity<NgApiResponse<List<com.dk_power.power_plant_java.dto.inventory.InventoryUsageDto>>> getInventoryUsage(
            @PathVariable Long id) {
        User user = getCurrentUser();
        if (user == null) return ResponseEntity.status(401).body(
                new NgApiResponse<>(null, "NOT_AUTHENTICATED"));

        return ResponseEntity.ok(new NgApiResponse<>(inventoryItemService.getUsageHistory(id), "Usage history retrieved"));
    }

    private User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof CustomUserDetails details) {
            return userRepo.findById(details.getId()).orElse(null);
        }
        return null;
    }
}
