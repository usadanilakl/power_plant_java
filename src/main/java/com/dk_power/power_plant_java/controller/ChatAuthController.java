package com.dk_power.power_plant_java.controller;

import com.dk_power.power_plant_java.config.security.JwtService;
import com.dk_power.power_plant_java.entities.users.User;
import com.dk_power.power_plant_java.repository.users.UserRepo;
import com.dk_power.power_plant_java.sevice.users.impl.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Issues short-lived Supabase-verifiable JWTs so an already-authenticated hub session (Electron
 * desktop or PWA) can talk directly to Supabase Realtime + RLS-protected chat tables. Used by
 * the Plant Chat feature — see {@code project/features/users/communication/plant-chat.md}.
 *
 * <p>Path is deliberately generic ({@code /api/chat/supabase-session}, not scoped under
 * {@code /ng/} or {@code /api/pwa/}) so both callers can reuse it. Requires any authenticated
 * user via the default catch-all rule in {@code SecurityConfigSpring}.
 */
@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
@Slf4j
public class ChatAuthController {

    private final JwtService jwtService;
    private final UserRepo userRepo;

    @Value("${supabase.url:}")
    private String supabaseUrl;

    @Value("${supabase.anon.key:}")
    private String supabaseAnonKey;

    @GetMapping("/supabase-session")
    public ResponseEntity<?> supabaseSession() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || auth.getPrincipal() == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        }

        User user = resolveUser(auth);
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Could not resolve current user"));
        }

        try {
            String token = jwtService.generateSupabaseSessionToken(user);
            Map<String, Object> body = new LinkedHashMap<>();
            body.put("token", token);
            body.put("expiresIn", jwtService.getSupabaseSessionTtlSeconds());
            body.put("supabaseUuid", user.getSupabaseUuid());
            body.put("displayName", user.getName() != null ? user.getName() : user.getEmail());
            // Include the Supabase project coordinates so callers don't need out-of-band config.
            // Anon key is safe to expose to authenticated clients — RLS is the real gate.
            if (!supabaseUrl.isBlank()) body.put("supabaseUrl", supabaseUrl);
            if (!supabaseAnonKey.isBlank()) body.put("supabaseAnonKey", supabaseAnonKey);
            return ResponseEntity.ok(body);
        } catch (IllegalStateException e) {
            // Missing supabase.jwt.secret on this hub, or user has no supabaseUuid yet.
            log.warn("[ChatAuth] Cannot mint Supabase session for user {}: {}", user.getEmail(), e.getMessage());
            return ResponseEntity.status(503).body(Map.of("error", e.getMessage()));
        }
    }

    private User resolveUser(Authentication auth) {
        Object principal = auth.getPrincipal();
        if (principal instanceof CustomUserDetails cud) {
            return userRepo.findById(cud.getId()).orElse(null);
        }
        // Fallback: look up by principal name (which is the user's email or username).
        String name = auth.getName();
        if (name == null) return null;
        User u = userRepo.findFirstByEmailIgnoreCaseOrderByIdAsc(name);
        if (u != null) return u;
        return userRepo.findFirstByUsernameIgnoreCaseOrderByIdAsc(name);
    }
}
