package com.dk_power.power_plant_java.controller.pwa;

import com.dk_power.power_plant_java.entities.users.User;
import com.dk_power.power_plant_java.enums.PermissionLevel;
import com.dk_power.power_plant_java.repository.users.UserRepo;
import com.dk_power.power_plant_java.sevice.pwa.PwaPermitService;
import com.dk_power.power_plant_java.sevice.users.impl.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/pwa/secured")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(originPatterns = {"https://dk-power.github.io", "http://localhost:*", "http://127.0.0.1:*"}, allowCredentials = "true")
public class PwaSecuredController {

    private final PwaPermitService pwaPermitService;
    private final UserRepo userRepo;
    private final PasswordEncoder passwordEncoder;

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

        Map<String, Object> result = pwaPermitService.signOff(id, user);
        if (result.containsKey("error")) {
            return ResponseEntity.badRequest().body(result);
        }
        return ResponseEntity.ok(result);
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
        profile.put("role", user.getRole());
        profile.put("permissionLevel", user.getPermissionLevel() != null ? user.getPermissionLevel() : "NONE");
        profile.put("isActive", Boolean.TRUE.equals(user.getIsActive()));
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
        userRepo.save(user);
        log.info("[PWA Profile] Password changed for user: {}", user.getEmail());
        return ResponseEntity.ok(Map.of("success", true, "message", "Password changed successfully"));
    }

    private User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof CustomUserDetails details) {
            return userRepo.findById(details.getId()).orElse(null);
        }
        return null;
    }
}
