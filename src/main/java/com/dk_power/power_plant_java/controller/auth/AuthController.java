package com.dk_power.power_plant_java.controller.auth;

import com.dk_power.power_plant_java.config.NetworkUtils;
import com.dk_power.power_plant_java.config.security.RestrictedAllowed;
import com.dk_power.power_plant_java.dto.email.EmailRequest;
import com.dk_power.power_plant_java.entities.users.AccessGrant;
import com.dk_power.power_plant_java.entities.users.AccessGrant.GrantStatus;
import com.dk_power.power_plant_java.entities.users.PasswordResetToken;
import com.dk_power.power_plant_java.entities.users.User;
import com.dk_power.power_plant_java.repository.users.AccessGrantRepository;
import com.dk_power.power_plant_java.repository.users.PasswordResetTokenRepository;
import com.dk_power.power_plant_java.repository.users.UserRepo;
import com.dk_power.power_plant_java.sevice.email.EmailFacadeService;
import com.dk_power.power_plant_java.sevice.users.impl.CustomUserDetails;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
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
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final EmailFacadeService emailFacadeService;

    @Value("${email.graph.from:}")
    private String emailFrom;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest,
                                   HttpServletRequest request, HttpServletResponse response) {
        try {
            Authentication auth = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.credential(), loginRequest.password())
            );

            // Spring Security 6.x requires explicit context save to session
            SecurityContext context = SecurityContextHolder.createEmptyContext();
            context.setAuthentication(auth);
            SecurityContextHolder.setContext(context);
            new HttpSessionSecurityContextRepository().saveContext(context, request, response);

            CustomUserDetails userDetails = (CustomUserDetails) auth.getPrincipal();
            User user = userRepo.findById(userDetails.getId()).orElse(null);
            // Lightweight native SQL update — avoids full entity save, entity listeners,
            // and lock contention with sync transactions on the USERS table
            userRepo.updateLastLoginById(LocalDateTime.now(), userDetails.getId());

            log.info("Login successful: {} from {}", loginRequest.credential(), NetworkUtils.getClientIp(request));

            Map<String, Object> resp = buildUserResponse(userDetails, user);
            resp.put("accessLevel", computeAccessLevel(user, request));
            return ResponseEntity.ok(resp);
        } catch (AuthenticationException e) {
            log.warn("Login failed for {}: {}", loginRequest.credential(), e.getMessage());
            return ResponseEntity.status(401).body(Map.of(
                "error", "INVALID_CREDENTIALS",
                "message", "Invalid email or password"
            ));
        }
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(HttpServletRequest request) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            // Return 200 with empty body instead of 401 to prevent browser's
            // native login popup (WWW-Authenticate header on 401 responses)
            return ResponseEntity.ok().build();
        }

        CustomUserDetails userDetails = (CustomUserDetails) auth.getPrincipal();
        User user = userRepo.findById(userDetails.getId()).orElse(null);

        Map<String, Object> response = buildUserResponse(userDetails, user);
        if (user != null) {
            response.put("accessLevel", computeAccessLevel(user, request));
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
    public ResponseEntity<?> getAccessStatus(HttpServletRequest request, HttpServletResponse httpResponse) {
        CustomUserDetails userDetails = getCurrentUserDetails();
        if (userDetails == null) return ResponseEntity.status(401).build();

        User user = userRepo.findById(userDetails.getId()).orElse(null);
        if (user == null) return ResponseEntity.status(401).build();

        // Check approved first
        var approved = accessGrantRepository.findFirstByUserAndStatusOrderByRequestedAtDesc(user, GrantStatus.APPROVED);
        if (approved.isPresent() && isGrantValid(approved.get())) {
            AccessGrant grant = approved.get();

            // Set ACCESS_TOKEN cookie so AccessGrantFilter can validate subsequent requests
            Cookie accessCookie = new Cookie("ACCESS_TOKEN", grant.getAccessToken());
            accessCookie.setPath("/");
            accessCookie.setHttpOnly(true);
            accessCookie.setSecure(request.isSecure() || "https".equalsIgnoreCase(request.getHeader("X-Forwarded-Proto")));
            accessCookie.setMaxAge((int) java.time.Duration.between(LocalDateTime.now(), grant.getExpiresAt()).getSeconds());
            httpResponse.addCookie(accessCookie);

            return ResponseEntity.ok(Map.of(
                "status", "APPROVED",
                "expiresAt", grant.getExpiresAt().toString(),
                "lastActiveAt", grant.getLastActiveAt() != null ? grant.getLastActiveAt().toString() : ""
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

    @RestrictedAllowed
    @GetMapping("/profile/sessions")
    public ResponseEntity<?> getMyAccessGrants() {
        CustomUserDetails userDetails = getCurrentUserDetails();
        if (userDetails == null) return ResponseEntity.status(401).build();

        User user = userRepo.findById(userDetails.getId()).orElse(null);
        if (user == null) return ResponseEntity.status(401).build();

        List<Map<String, Object>> grants = accessGrantRepository.findByUserOrderByRequestedAtDesc(user)
            .stream().map(this::toGrantSummary).toList();
        return ResponseEntity.ok(grants);
    }

    @PostMapping("/profile/change-password")
    public ResponseEntity<?> changePassword(@RequestBody ChangePasswordRequest req) {
        CustomUserDetails userDetails = getCurrentUserDetails();
        if (userDetails == null) return ResponseEntity.status(401).build();

        User user = userRepo.findById(userDetails.getId()).orElse(null);
        if (user == null) return ResponseEntity.status(401).build();

        if (!passwordEncoder.matches(req.currentPassword(), user.getPassword())) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", "WRONG_PASSWORD",
                "message", "Current password is incorrect"
            ));
        }

        if (req.newPassword() == null || req.newPassword().length() < 8) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", "WEAK_PASSWORD",
                "message", "New password must be at least 8 characters"
            ));
        }

        user.setPassword(passwordEncoder.encode(req.newPassword()));
        userRepo.save(user);
        log.info("Password changed by user: {}", user.getEmail());

        return ResponseEntity.ok(Map.of("message", "Password changed successfully"));
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

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody ForgotPasswordRequest req, HttpServletRequest request) {
        // Always return success to avoid leaking whether an email exists
        String genericMessage = "If an account with that email exists, a password reset link has been sent.";

        User user = userRepo.findFirstByEmailOrderByIdAsc(req.email());
        if (user == null) {
            log.info("Password reset requested for unknown email: {}", req.email());
            return ResponseEntity.ok(Map.of("message", genericMessage));
        }

        // Generate token
        String token = UUID.randomUUID().toString();
        PasswordResetToken resetToken = PasswordResetToken.builder()
            .user(user)
            .token(token)
            .expiresAt(LocalDateTime.now().plusHours(1))
            .createdAt(LocalDateTime.now())
            .build();
        passwordResetTokenRepository.save(resetToken);

        // Build reset URL from the request
        String baseUrl = request.getScheme() + "://" + request.getServerName();
        int port = request.getServerPort();
        if ((request.getScheme().equals("http") && port != 80) ||
            (request.getScheme().equals("https") && port != 443)) {
            baseUrl += ":" + port;
        }
        String resetLink = baseUrl + "/app/reset-password?token=" + token;

        // Send email
        try {
            emailFacadeService.sendEmail(EmailRequest.builder()
                .to(user.getEmail())
                .from(emailFrom)
                .subject("Password Reset - Power Plant Manager")
                .body("Hello " + user.getName() + ",\n\n"
                    + "A password reset was requested for your account.\n\n"
                    + "Click the link below to reset your password:\n"
                    + resetLink + "\n\n"
                    + "This link expires in 1 hour.\n\n"
                    + "If you did not request this, please ignore this email.\n")
                .build());
            log.info("Password reset email sent to {}", user.getEmail());
        } catch (Exception e) {
            log.error("Failed to send password reset email to {}: {}", user.getEmail(), e.getMessage());
        }

        return ResponseEntity.ok(Map.of("message", genericMessage));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody ResetPasswordRequest req) {
        var tokenOpt = passwordResetTokenRepository.findByToken(req.token());
        if (tokenOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", "INVALID_TOKEN",
                "message", "Invalid or expired reset link."
            ));
        }

        PasswordResetToken resetToken = tokenOpt.get();

        if (resetToken.isUsed()) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", "TOKEN_USED",
                "message", "This reset link has already been used."
            ));
        }

        if (LocalDateTime.now().isAfter(resetToken.getExpiresAt())) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", "TOKEN_EXPIRED",
                "message", "This reset link has expired. Please request a new one."
            ));
        }

        if (req.newPassword() == null || req.newPassword().length() < 8) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", "WEAK_PASSWORD",
                "message", "Password must be at least 8 characters."
            ));
        }

        User user = resetToken.getUser();
        user.setPassword(passwordEncoder.encode(req.newPassword()));
        userRepo.save(user);

        resetToken.setUsed(true);
        passwordResetTokenRepository.save(resetToken);

        log.info("Password reset completed for user: {}", user.getEmail());
        return ResponseEntity.ok(Map.of("message", "Password has been reset successfully. You can now sign in."));
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

    /**
     * Determine effective access level based on request origin and grants.
     * Localhost/LAN always get FULL (AccessGrantFilter bypasses them).
     * External users need an approved grant for FULL.
     */
    private String computeAccessLevel(User user, HttpServletRequest request) {
        // Localhost and LAN always have full access
        if (NetworkUtils.isInternalRequest(request)) {
            return "FULL";
        }
        // External: check grants
        var grant = accessGrantRepository.findFirstByUserAndStatusOrderByRequestedAtDesc(user, GrantStatus.APPROVED);
        if (grant.isPresent() && isGrantValid(grant.get())) {
            return "FULL";
        }
        var pending = accessGrantRepository.findFirstByUserAndStatusOrderByRequestedAtDesc(user, GrantStatus.PENDING);
        return pending.isPresent() ? "PENDING" : "RESTRICTED";
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

    private Map<String, Object> toGrantSummary(AccessGrant grant) {
        Map<String, Object> info = new LinkedHashMap<>();
        info.put("id", grant.getId());
        info.put("status", grant.getStatus());
        info.put("requestIp", grant.getRequestIp());
        info.put("deviceInfo", grant.getDeviceInfo());
        info.put("requestedAt", grant.getRequestedAt() != null ? grant.getRequestedAt().toString() : null);
        info.put("approvedAt", grant.getApprovedAt() != null ? grant.getApprovedAt().toString() : null);
        info.put("expiresAt", grant.getExpiresAt() != null ? grant.getExpiresAt().toString() : null);
        info.put("lastActiveAt", grant.getLastActiveAt() != null ? grant.getLastActiveAt().toString() : null);
        return info;
    }

    public record LoginRequest(String credential, String password) {}
    public record UpdateProfileRequest(String firstName, String lastName, String password) {}
    public record ChangePasswordRequest(String currentPassword, String newPassword) {}
    public record ForgotPasswordRequest(String email) {}
    public record ResetPasswordRequest(String token, String newPassword) {}
}
