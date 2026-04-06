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

            if (!Boolean.TRUE.equals(user.getIsActive())) {
                return ResponseEntity.status(401).body(Map.of(
                        "error", "ACCOUNT_INACTIVE",
                        "message", "Account not yet approved. Please contact an administrator."));
            }

            // Update last login
            userRepo.updateLastLoginById(LocalDateTime.now(), user.getId());

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
            if (user == null || !Boolean.TRUE.equals(user.getIsActive())) {
                return ResponseEntity.status(401).body(Map.of(
                        "error", "INVALID_TOKEN", "message", "Token is no longer valid"));
            }

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
        info.put("role", user.getRole());
        info.put("permissionLevel", user.getPermissionLevel() != null ? user.getPermissionLevel() : PermissionLevel.NONE);
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

    public record LoginRequest(String email, String password) {}
    public record RefreshRequest(String token) {}
    public record LookupRequest(String credential) {}
}
