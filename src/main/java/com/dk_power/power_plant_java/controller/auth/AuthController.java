package com.dk_power.power_plant_java.controller.auth;

import com.dk_power.power_plant_java.config.NetworkUtils;
import com.dk_power.power_plant_java.entities.users.AccessGrant;
import com.dk_power.power_plant_java.entities.users.AccessGrant.GrantStatus;
import com.dk_power.power_plant_java.entities.users.User;
import com.dk_power.power_plant_java.repository.users.AccessGrantRepository;
import com.dk_power.power_plant_java.repository.users.UserRepo;
import com.dk_power.power_plant_java.sevice.users.impl.CustomUserDetails;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UserRepo userRepo;
    private final AccessGrantRepository accessGrantRepository;
    private final PasswordEncoder passwordEncoder;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest, HttpServletRequest request) {
        try {
            Authentication auth = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.email(), loginRequest.password())
            );
            SecurityContextHolder.getContext().setAuthentication(auth);

            // Update session
            request.getSession(true);

            CustomUserDetails userDetails = (CustomUserDetails) auth.getPrincipal();
            User user = userRepo.findByEmail(loginRequest.email());
            if (user != null) {
                user.setLastLoginDate(LocalDateTime.now());
                userRepo.save(user);
            }

            log.info("Login successful: {} from {}", loginRequest.email(), NetworkUtils.getClientIp(request));

            return ResponseEntity.ok(buildUserResponse(userDetails, user));
        } catch (AuthenticationException e) {
            log.warn("Login failed for {}: {}", loginRequest.email(), e.getMessage());
            return ResponseEntity.status(401).body(Map.of(
                "error", "INVALID_CREDENTIALS",
                "message", "Invalid email or password"
            ));
        }
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            return ResponseEntity.status(401).body(Map.of("error", "NOT_AUTHENTICATED"));
        }

        CustomUserDetails userDetails = (CustomUserDetails) auth.getPrincipal();
        User user = userRepo.findById(userDetails.getId()).orElse(null);

        Map<String, Object> response = buildUserResponse(userDetails, user);

        // Include access grant status if exists
        if (user != null) {
            var grant = accessGrantRepository.findFirstByUserAndStatusOrderByRequestedAtDesc(user, GrantStatus.APPROVED);
            if (grant.isPresent() && isGrantValid(grant.get())) {
                response.put("accessLevel", "FULL");
            } else {
                var pending = accessGrantRepository.findFirstByUserAndStatusOrderByRequestedAtDesc(user, GrantStatus.PENDING);
                response.put("accessLevel", pending.isPresent() ? "PENDING" : "RESTRICTED");
            }
        }

        return ResponseEntity.ok(response);
    }

    @PostMapping("/request-access")
    public ResponseEntity<?> requestAccess(HttpServletRequest request) {
        CustomUserDetails userDetails = getCurrentUserDetails();
        if (userDetails == null) return ResponseEntity.status(401).build();

        User user = userRepo.findById(userDetails.getId()).orElse(null);
        if (user == null) return ResponseEntity.status(401).build();

        // Check for existing pending request
        var existing = accessGrantRepository.findFirstByUserAndStatusOrderByRequestedAtDesc(user, GrantStatus.PENDING);
        if (existing.isPresent()) {
            return ResponseEntity.ok(Map.of(
                "status", "ALREADY_PENDING",
                "message", "You already have a pending access request",
                "requestedAt", existing.get().getRequestedAt().toString()
            ));
        }

        // Check for existing valid grant
        var activeGrant = accessGrantRepository.findFirstByUserAndStatusOrderByRequestedAtDesc(user, GrantStatus.APPROVED);
        if (activeGrant.isPresent() && isGrantValid(activeGrant.get())) {
            return ResponseEntity.ok(Map.of(
                "status", "ALREADY_APPROVED",
                "message", "You already have an active access grant",
                "expiresAt", activeGrant.get().getExpiresAt().toString()
            ));
        }

        AccessGrant grant = AccessGrant.builder()
            .user(user)
            .requestIp(NetworkUtils.getClientIp(request))
            .deviceInfo(request.getHeader("User-Agent"))
            .status(GrantStatus.PENDING)
            .requestedAt(LocalDateTime.now())
            .build();

        accessGrantRepository.save(grant);
        log.info("Access request created: user={}, ip={}", user.getEmail(), grant.getRequestIp());

        return ResponseEntity.ok(Map.of(
            "status", "PENDING",
            "message", "Access request submitted. An administrator must approve it.",
            "requestId", grant.getId()
        ));
    }

    @GetMapping("/access-status")
    public ResponseEntity<?> getAccessStatus() {
        CustomUserDetails userDetails = getCurrentUserDetails();
        if (userDetails == null) return ResponseEntity.status(401).build();

        User user = userRepo.findById(userDetails.getId()).orElse(null);
        if (user == null) return ResponseEntity.status(401).build();

        // Check approved first
        var approved = accessGrantRepository.findFirstByUserAndStatusOrderByRequestedAtDesc(user, GrantStatus.APPROVED);
        if (approved.isPresent() && isGrantValid(approved.get())) {
            return ResponseEntity.ok(Map.of(
                "status", "APPROVED",
                "expiresAt", approved.get().getExpiresAt().toString(),
                "lastActiveAt", approved.get().getLastActiveAt() != null ? approved.get().getLastActiveAt().toString() : ""
            ));
        }

        // Check pending
        var pending = accessGrantRepository.findFirstByUserAndStatusOrderByRequestedAtDesc(user, GrantStatus.PENDING);
        if (pending.isPresent()) {
            return ResponseEntity.ok(Map.of(
                "status", "PENDING",
                "requestedAt", pending.get().getRequestedAt().toString()
            ));
        }

        return ResponseEntity.ok(Map.of("status", "NONE"));
    }

    @GetMapping("/profile")
    public ResponseEntity<?> getProfile() {
        CustomUserDetails userDetails = getCurrentUserDetails();
        if (userDetails == null) return ResponseEntity.status(401).body(Map.of("error", "NOT_AUTHENTICATED"));

        User user = userRepo.findById(userDetails.getId()).orElse(null);
        if (user == null) return ResponseEntity.status(401).body(Map.of("error", "USER_NOT_FOUND"));

        Map<String, Object> profile = new LinkedHashMap<>();
        profile.put("id", user.getId());
        profile.put("username", user.getUsername());
        profile.put("firstName", user.getFirstName());
        profile.put("lastName", user.getLastName());
        profile.put("name", user.getName());
        profile.put("email", user.getEmail());
        profile.put("role", user.getRole());
        profile.put("isActive", user.getIsActive());
        profile.put("lastLoginDate", user.getLastLoginDate() != null ? user.getLastLoginDate().toString() : null);
        profile.put("windowsUsername", user.getWindowsUsername());
        return ResponseEntity.ok(profile);
    }

    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(@RequestBody UpdateProfileRequest req) {
        CustomUserDetails userDetails = getCurrentUserDetails();
        if (userDetails == null) return ResponseEntity.status(401).body(Map.of("error", "NOT_AUTHENTICATED"));

        User user = userRepo.findById(userDetails.getId()).orElse(null);
        if (user == null) return ResponseEntity.status(401).body(Map.of("error", "USER_NOT_FOUND"));

        if (req.firstName() != null) user.setFirstName(req.firstName());
        if (req.lastName() != null) user.setLastName(req.lastName());
        if (req.firstName() != null || req.lastName() != null) {
            user.setName((user.getFirstName() + " " + user.getLastName()).trim());
        }
        if (req.password() != null && !req.password().isBlank()) {
            user.setPassword(passwordEncoder.encode(req.password()));
        }

        userRepo.save(user);
        log.info("Profile updated by user: {}", user.getEmail());

        return ResponseEntity.ok(Map.of("message", "Profile updated successfully"));
    }

    private Map<String, Object> buildUserResponse(CustomUserDetails userDetails, User user) {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("id", userDetails.getId());
        response.put("name", userDetails.getName());
        response.put("email", userDetails.getUsername());
        response.put("role", user != null ? user.getRole() : "");
        response.put("isActive", user != null ? user.getIsActive() : true);
        return response;
    }

    private boolean isGrantValid(AccessGrant grant) {
        LocalDateTime now = LocalDateTime.now();
        if (grant.getExpiresAt() != null && now.isAfter(grant.getExpiresAt())) return false;
        if (grant.getLastActiveAt() != null && now.isAfter(grant.getLastActiveAt().plusHours(1))) return false;
        return true;
    }

    private CustomUserDetails getCurrentUserDetails() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof CustomUserDetails) {
            return (CustomUserDetails) auth.getPrincipal();
        }
        return null;
    }

    public record LoginRequest(String email, String password) {}
    public record UpdateProfileRequest(String firstName, String lastName, String password) {}
}
