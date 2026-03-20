package com.dk_power.power_plant_java.controller.auth;

import com.dk_power.power_plant_java.config.NetworkUtils;
import com.dk_power.power_plant_java.entities.users.AccessGrant;
import com.dk_power.power_plant_java.entities.users.AccessGrant.GrantStatus;
import com.dk_power.power_plant_java.entities.users.User;
import com.dk_power.power_plant_java.repository.users.AccessGrantRepository;
import com.dk_power.power_plant_java.repository.users.UserRepo;
import com.dk_power.power_plant_java.sevice.users.impl.CustomUserDetails;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;

/**
 * Admin endpoints for managing web access grants.
 * Requires ADMIN role + localhost (desktop) access only.
 */
@RestController
@RequestMapping("/api/auth/admin")
@RequiredArgsConstructor
@Slf4j
public class AccessAdminController {

    private final AccessGrantRepository accessGrantRepository;
    private final UserRepo userRepo;

    @GetMapping("/pending")
    public ResponseEntity<?> getPendingRequests(HttpServletRequest request) {
        if (!NetworkUtils.isLoopbackRequest(request)) {
            return ResponseEntity.status(403).body(Map.of(
                "error", "LOCALHOST_REQUIRED",
                "message", "Access management is only available from the desktop application"
            ));
        }

        List<AccessGrant> pending = accessGrantRepository.findByStatus(GrantStatus.PENDING);
        return ResponseEntity.ok(pending.stream().map(this::toGrantInfo).toList());
    }

    @GetMapping("/active-grants")
    public ResponseEntity<?> getActiveGrants(HttpServletRequest request) {
        if (!NetworkUtils.isLoopbackRequest(request)) {
            return ResponseEntity.status(403).body(Map.of(
                "error", "LOCALHOST_REQUIRED",
                "message", "Access management is only available from the desktop application"
            ));
        }

        List<AccessGrant> approved = accessGrantRepository.findByStatus(GrantStatus.APPROVED);
        // Filter to only valid (non-expired) grants
        LocalDateTime now = LocalDateTime.now();
        List<Map<String, Object>> activeGrants = approved.stream()
            .filter(g -> g.getExpiresAt() == null || now.isBefore(g.getExpiresAt()))
            .filter(g -> g.getLastActiveAt() == null || now.isBefore(g.getLastActiveAt().plusHours(1)))
            .map(this::toGrantInfo)
            .toList();

        return ResponseEntity.ok(activeGrants);
    }

    @PostMapping("/approve/{id}")
    public ResponseEntity<?> approveRequest(@PathVariable Long id,
                                            HttpServletRequest request,
                                            HttpServletResponse response) {
        if (!NetworkUtils.isLoopbackRequest(request)) {
            return ResponseEntity.status(403).body(Map.of(
                "error", "LOCALHOST_REQUIRED",
                "message", "Access approval is only available from the desktop application"
            ));
        }

        AccessGrant grant = accessGrantRepository.findById(id).orElse(null);
        if (grant == null) {
            return ResponseEntity.notFound().build();
        }
        if (grant.getStatus() != GrantStatus.PENDING) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", "INVALID_STATE",
                "message", "Grant is not in PENDING state (current: " + grant.getStatus() + ")"
            ));
        }

        // Get approving admin
        User approver = getAdminUser();

        String accessToken = UUID.randomUUID().toString();
        LocalDateTime now = LocalDateTime.now();

        grant.setStatus(GrantStatus.APPROVED);
        grant.setAccessToken(accessToken);
        grant.setApprovedAt(now);
        grant.setExpiresAt(now.plusHours(24));
        grant.setLastActiveAt(now);
        grant.setApprovedBy(approver);
        accessGrantRepository.save(grant);

        log.info("Access approved: user={}, approvedBy={}, token={}...",
            grant.getUser().getEmail(),
            approver != null ? approver.getEmail() : "unknown",
            accessToken.substring(0, 8));

        return ResponseEntity.ok(Map.of(
            "success", true,
            "accessToken", accessToken,
            "expiresAt", grant.getExpiresAt().toString(),
            "user", grant.getUser().getEmail()
        ));
    }

    @PostMapping("/deny/{id}")
    public ResponseEntity<?> denyRequest(@PathVariable Long id, HttpServletRequest request) {
        if (!NetworkUtils.isLoopbackRequest(request)) {
            return ResponseEntity.status(403).body(Map.of("error", "LOCALHOST_REQUIRED"));
        }

        AccessGrant grant = accessGrantRepository.findById(id).orElse(null);
        if (grant == null) return ResponseEntity.notFound().build();

        grant.setStatus(GrantStatus.DENIED);
        accessGrantRepository.save(grant);

        log.info("Access denied: user={}", grant.getUser().getEmail());
        return ResponseEntity.ok(Map.of("success", true, "message", "Access request denied"));
    }

    @PostMapping("/revoke/{id}")
    public ResponseEntity<?> revokeGrant(@PathVariable Long id, HttpServletRequest request) {
        if (!NetworkUtils.isLoopbackRequest(request)) {
            return ResponseEntity.status(403).body(Map.of("error", "LOCALHOST_REQUIRED"));
        }

        AccessGrant grant = accessGrantRepository.findById(id).orElse(null);
        if (grant == null) return ResponseEntity.notFound().build();

        grant.setStatus(GrantStatus.REVOKED);
        accessGrantRepository.save(grant);

        log.info("Access revoked: user={}", grant.getUser().getEmail());
        return ResponseEntity.ok(Map.of("success", true, "message", "Access grant revoked"));
    }

    @PostMapping("/prolong/{id}")
    public ResponseEntity<?> prolongGrant(@PathVariable Long id,
                                          @RequestBody ProlongRequest req,
                                          HttpServletRequest request) {
        if (!NetworkUtils.isLoopbackRequest(request)) {
            return ResponseEntity.status(403).body(Map.of("error", "LOCALHOST_REQUIRED",
                "message", "Grant prolongation is only available from the desktop application"));
        }

        AccessGrant grant = accessGrantRepository.findById(id).orElse(null);
        if (grant == null) return ResponseEntity.notFound().build();

        if (grant.getStatus() != GrantStatus.APPROVED) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", "INVALID_STATE",
                "message", "Only APPROVED grants can be prolonged (current: " + grant.getStatus() + ")"
            ));
        }

        int hours = req.hours() != null ? req.hours() : 24;
        if (hours < 1 || hours > 72) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", "INVALID_DURATION",
                "message", "Duration must be between 1 and 72 hours"
            ));
        }

        LocalDateTime now = LocalDateTime.now();
        grant.setExpiresAt(now.plusHours(hours));
        grant.setLastActiveAt(now);
        accessGrantRepository.save(grant);

        log.info("Access prolonged: user={}, hours={}, newExpiry={}",
            grant.getUser().getEmail(), hours, grant.getExpiresAt());

        return ResponseEntity.ok(Map.of(
            "success", true,
            "message", "Grant extended by " + hours + " hours",
            "expiresAt", grant.getExpiresAt().toString()
        ));
    }

    @GetMapping("/grant-history")
    public ResponseEntity<?> getGrantHistory(HttpServletRequest request) {
        if (!NetworkUtils.isLoopbackRequest(request)) {
            return ResponseEntity.status(403).body(Map.of("error", "LOCALHOST_REQUIRED",
                "message", "Grant history is only available from the desktop application"));
        }

        List<AccessGrant> allGrants = accessGrantRepository.findAllByOrderByRequestedAtDesc();
        return ResponseEntity.ok(allGrants.stream().map(this::toGrantInfo).toList());
    }

    // ============ PWA User Management ============

    @GetMapping("/pwa-users")
    public ResponseEntity<?> getPwaUsers(HttpServletRequest request) {
        if (!NetworkUtils.isLoopbackRequest(request)) {
            return ResponseEntity.status(403).body(Map.of(
                "error", "LOCALHOST_REQUIRED",
                "message", "PWA user management is only available from the desktop application"
            ));
        }

        List<User> pwaUsers = userRepo.findAll().stream()
                .filter(u -> "PWA_USER".equals(u.getRole()))
                .toList();

        return ResponseEntity.ok(pwaUsers.stream().map(u -> {
            Map<String, Object> info = new LinkedHashMap<>();
            info.put("id", u.getId());
            info.put("name", u.getName());
            info.put("email", u.getEmail());
            info.put("phone", u.getFirstName()); // phone stored elsewhere; use what we have
            info.put("isActive", u.getIsActive());
            info.put("permissionLevel", u.getPermissionLevel());
            info.put("pwaUserUuid", u.getPwaUserUuid());
            info.put("dateCreated", u.getDateCreated() != null ? u.getDateCreated().toString() : null);
            return info;
        }).toList());
    }

    @PostMapping("/pwa-users/{id}/activate")
    public ResponseEntity<?> activatePwaUser(@PathVariable Long id,
                                              @RequestBody Map<String, String> body,
                                              HttpServletRequest request) {
        if (!NetworkUtils.isLoopbackRequest(request)) {
            return ResponseEntity.status(403).body(Map.of("error", "LOCALHOST_REQUIRED"));
        }

        User user = userRepo.findById(id).orElse(null);
        if (user == null) return ResponseEntity.notFound().build();

        String level = body.getOrDefault("permissionLevel", "BASIC");
        user.setIsActive(true);
        user.setPermissionLevel(level);
        userRepo.save(user);

        log.info("PWA user activated: email={}, permissionLevel={}", user.getEmail(), level);
        return ResponseEntity.ok(Map.of("success", true, "message", "User activated with " + level + " access"));
    }

    @PostMapping("/pwa-users/{id}/permission-level")
    public ResponseEntity<?> setPwaUserPermissionLevel(@PathVariable Long id,
                                                        @RequestBody Map<String, String> body,
                                                        HttpServletRequest request) {
        if (!NetworkUtils.isLoopbackRequest(request)) {
            return ResponseEntity.status(403).body(Map.of("error", "LOCALHOST_REQUIRED"));
        }

        User user = userRepo.findById(id).orElse(null);
        if (user == null) return ResponseEntity.notFound().build();

        String level = body.get("level");
        if (level == null || level.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "MISSING_LEVEL", "message", "Permission level required"));
        }

        user.setPermissionLevel(level);
        userRepo.save(user);

        log.info("PWA user permission updated: email={}, permissionLevel={}", user.getEmail(), level);
        return ResponseEntity.ok(Map.of("success", true, "message", "Permission level set to " + level));
    }

    @PostMapping("/pwa-users/{id}/deactivate")
    public ResponseEntity<?> deactivatePwaUser(@PathVariable Long id, HttpServletRequest request) {
        if (!NetworkUtils.isLoopbackRequest(request)) {
            return ResponseEntity.status(403).body(Map.of("error", "LOCALHOST_REQUIRED"));
        }

        User user = userRepo.findById(id).orElse(null);
        if (user == null) return ResponseEntity.notFound().build();

        user.setIsActive(false);
        userRepo.save(user);

        log.info("PWA user deactivated: email={}", user.getEmail());
        return ResponseEntity.ok(Map.of("success", true, "message", "User deactivated"));
    }

    // ============ Grant Management ============

    private Map<String, Object> toGrantInfo(AccessGrant grant) {
        Map<String, Object> info = new LinkedHashMap<>();
        info.put("id", grant.getId());
        info.put("userId", grant.getUser().getId());
        info.put("userName", grant.getUser().getName());
        info.put("userEmail", grant.getUser().getEmail());
        info.put("status", grant.getStatus());
        info.put("requestIp", grant.getRequestIp());
        info.put("deviceInfo", grant.getDeviceInfo());
        info.put("requestedAt", grant.getRequestedAt() != null ? grant.getRequestedAt().toString() : null);
        info.put("approvedAt", grant.getApprovedAt() != null ? grant.getApprovedAt().toString() : null);
        info.put("expiresAt", grant.getExpiresAt() != null ? grant.getExpiresAt().toString() : null);
        info.put("lastActiveAt", grant.getLastActiveAt() != null ? grant.getLastActiveAt().toString() : null);
        if (grant.getApprovedBy() != null) {
            info.put("approvedByName", grant.getApprovedBy().getName());
        }
        return info;
    }

    private User getAdminUser() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof CustomUserDetails details) {
            return userRepo.findById(details.getId()).orElse(null);
        }
        return null;
    }

    public record ProlongRequest(Integer hours) {}
}
