package com.dk_power.power_plant_java.controller.pwa;

import com.dk_power.power_plant_java.config.security.JwtService;
import com.dk_power.power_plant_java.entities.users.User;
import com.dk_power.power_plant_java.enums.PermissionLevel;
import com.dk_power.power_plant_java.repository.users.UserRepo;
import com.dk_power.power_plant_java.sevice.users.impl.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/pwa/auth")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(originPatterns = {"https://dk-power.github.io", "https://jacksongeneration.github.io", "http://localhost:*", "http://127.0.0.1:*"}, allowCredentials = "true")
public class PwaAuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final UserRepo userRepo;
    private final com.dk_power.power_plant_java.sevice.auth.SyncAtLoginService syncAtLoginService;
    private final com.dk_power.power_plant_java.sevice.auth.SupabaseAdminClient supabaseAdminClient;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest req) {
        try {
            Authentication auth = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(req.email(), req.password())
            );

            CustomUserDetails userDetails = (CustomUserDetails) auth.getPrincipal();
            User user = userRepo.findById(userDetails.getId()).orElse(null);
            if (user == null) {
                return ResponseEntity.status(401).body(Map.of(
                        "error", "USER_NOT_FOUND", "message", "User not found"));
            }

            // NOTE: a pending-approval (isActive=false) user CAN log in. They receive a token carrying
            // their current roles (no ROLE_PLANT until an admin approves), which unlocks the OPEN tier-1
            // features (work-request, JHA, field-list, inventory). Approval gates the /api/pwa/secured/**
            // plant features — enforced by PwaJwtAuthFilter (isActive) + the role rules in SecurityConfig.

            // Update last login
            userRepo.updateLastLoginById(LocalDateTime.now(), user.getId());

            // Dual-authority sync-at-login: reconcile Supabase with the just-verified plaintext (async).
            syncAtLoginService.reconcileAfterHubLoginAsync(user.getId(), req.password());

            String token = jwtService.generateToken(user);
            log.info("[PWA Auth] Login successful: {}", user.getEmail());

            Map<String, Object> response = new LinkedHashMap<>();
            response.put("token", token);
            response.put("expiresIn", jwtService.getExpirationSeconds());
            response.put("user", buildUserInfo(user));
            return ResponseEntity.ok(response);
        } catch (AuthenticationException e) {
            log.warn("[PWA Auth] Login failed for {}: {}", req.email(), e.getMessage());
            return ResponseEntity.status(401).body(Map.of(
                    "error", "INVALID_CREDENTIALS",
                    "message", "Invalid email or password"));
        }
    }

    @PostMapping("/refresh")
    public ResponseEntity<?> refresh(@RequestBody RefreshRequest req) {
        try {
            var claims = jwtService.validateToken(req.token());
            String email = claims.getSubject();

            User user = userRepo.findFirstByEmailOrderByIdAsc(email);
            if (user == null) {
                return ResponseEntity.status(401).body(Map.of(
                        "error", "INVALID_TOKEN", "message", "Token is no longer valid"));
            }
            // isActive is NOT re-checked here — a pending-approval user keeps a working (tier-1) session;
            // the secured/plant endpoints remain gated by PwaJwtAuthFilter + roles.

            String newToken = jwtService.generateToken(user);
            log.info("[PWA Auth] Token refreshed: {}", email);

            Map<String, Object> response = new LinkedHashMap<>();
            response.put("token", newToken);
            response.put("expiresIn", jwtService.getExpirationSeconds());
            response.put("user", buildUserInfo(user));
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(401).body(Map.of(
                    "error", "INVALID_TOKEN", "message", "Token is invalid or expired"));
        }
    }

    @GetMapping("/me")
    public ResponseEntity<?> me() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof CustomUserDetails userDetails)) {
            return ResponseEntity.status(401).body(Map.of("error", "NOT_AUTHENTICATED"));
        }

        User user = userRepo.findById(userDetails.getId()).orElse(null);
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("error", "USER_NOT_FOUND"));
        }

        return ResponseEntity.ok(buildUserInfo(user));
    }

    private Map<String, Object> buildUserInfo(User user) {
        Map<String, Object> info = new LinkedHashMap<>();
        info.put("id", user.getId());
        info.put("name", user.getName());
        info.put("email", user.getEmail());
        info.put("roles", user.getRoles());
        info.put("permissionLevel", user.getPermissionLevel() != null ? user.getPermissionLevel() : PermissionLevel.NONE);
        info.put("isActive", Boolean.TRUE.equals(user.getIsActive()));
        return info;
    }

    @PostMapping("/lookup")
    public ResponseEntity<?> lookup(@RequestBody LookupRequest req) {
        if (req.credential() == null || req.credential().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("status", "INVALID", "message", "Credential is required"));
        }

        User user = userRepo.findFirstByEmailIgnoreCaseOrderByIdAsc(req.credential().trim());
        if (user == null) {
            user = userRepo.findFirstByUsernameIgnoreCaseOrderByIdAsc(req.credential().trim());
        }

        if (user == null) {
            return ResponseEntity.ok(Map.of("status", "NOT_FOUND"));
        }

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("status", "FOUND");
        response.put("isActive", Boolean.TRUE.equals(user.getIsActive()));
        response.put("name", user.getName() != null ? user.getName() : "");
        response.put("email", user.getEmail() != null ? user.getEmail() : "");
        return ResponseEntity.ok(response);
    }

    /**
     * Dual-authority convergence endpoint. Called by the PWA after it logged in via the Supabase
     * fallback (hub was down / rejected a stale password) and the hub is now reachable. The hub
     * independently verifies the email+password against Supabase (a password grant — proving
     * KNOWLEDGE of the password, not mere possession of a stealable bearer token) before using the
     * plaintext to converge the hub side (LWW): overwrite the hub password when Supabase's is newer,
     * or auto-provision a hub row for a Supabase-only user.
     */
    @PostMapping("/reconcile")
    public ResponseEntity<?> reconcile(@RequestBody ReconcileRequest req) {
        if (req.email() == null || req.email().isBlank()
                || req.password() == null || req.password().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "MISSING_FIELDS"));
        }
        String email = req.email().trim();
        // Gate on password knowledge, verified against Supabase itself — NOT on a bearer token.
        if (!supabaseAdminClient.verifyPassword(email, req.password())) {
            return ResponseEntity.status(401).body(Map.of(
                    "error", "SUPABASE_VERIFY_FAILED",
                    "message", "Supabase could not verify these credentials"));
        }

        var result = syncAtLoginService.reconcileAfterSupabaseLogin(email, req.password());
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("reconciled", result.hubPasswordUpdated() || result.hubUserProvisioned());
        body.put("provisioned", result.hubUserProvisioned());
        body.put("message", result.message());
        return ResponseEntity.ok(body);
    }

    public record LoginRequest(String email, String password) {}
    public record RefreshRequest(String token) {}
    public record LookupRequest(String credential) {}
    public record ReconcileRequest(String email, String password) {}
}
