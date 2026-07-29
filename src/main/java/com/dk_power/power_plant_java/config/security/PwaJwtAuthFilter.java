package com.dk_power.power_plant_java.config.security;

import com.dk_power.power_plant_java.config.logging.LoggingContext;
import com.dk_power.power_plant_java.entities.users.User;
import com.dk_power.power_plant_java.repository.users.UserRepo;
import com.dk_power.power_plant_java.sevice.users.impl.CustomUserDetails;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Map;
import java.util.Set;

@Component
@RequiredArgsConstructor
@Slf4j
public class PwaJwtAuthFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserRepo userRepo;
    private final ObjectMapper objectMapper;
    private final com.dk_power.power_plant_java.sevice.auth.SyncAtLoginService syncAtLoginService;

    private static final Set<String> SECURED_PREFIXES = Set.of(
            "/api/pwa/secured/",
            "/api/pwa/auth/me",
            "/api/pwa/auth/refresh",
            // ChatAuthController lives at a generic /api/chat/ path so both Electron (via
            // localhost auto-auth) AND the PWA (via JWT) can reach it. Without this prefix, PWA
            // calls to /api/chat/supabase-session hit the endpoint unauthenticated and the
            // controller returns 401 "Not authenticated" — even for legit plant-group users.
            "/api/chat/"
    );

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String path = request.getRequestURI();

        // Only activate for secured PWA paths
        if (!requiresJwt(path)) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = extractToken(request);
        if (token == null) {
            sendError(response, 401, "MISSING_TOKEN", "Authorization header with Bearer token required");
            return;
        }
        try {
            // validateToken reads iss and verifies with the matching key (hub RS256 or Supabase).
            var claims = jwtService.validateToken(token);
            String email = jwtService.extractEmail(claims);
            boolean hubIssued = jwtService.isHubIssued(claims);

            User user = userRepo.findFirstByEmailOrderByIdAsc(email);
            if (user == null) {
                if (!hubIssued) {
                    // Supabase-only user whose hub row doesn't exist yet: auto-provision it on this
                    // request (inactive, pending admin approval). The isActive gate below then returns
                    // 403 so the user knows they still need approval.
                    user = syncAtLoginService.provisionHubUserFromSupabase(email, null, null);
                    log.info("[PWA JWT] Auto-provisioned hub row for Supabase user {}", email);
                } else {
                    sendError(response, 401, "USER_NOT_FOUND", "User no longer exists");
                    return;
                }
            }

            // Build the security context first — roles drive access to the role-gated plant endpoints.
            var authorities = user.getRoles().stream()
                    .map(SimpleGrantedAuthority::new)
                    .collect(java.util.stream.Collectors.toSet());
            var userDetails = new CustomUserDetails(user, authorities);
            var authToken = new UsernamePasswordAuthenticationToken(userDetails, null, authorities);
            SecurityContextHolder.getContext().setAuthentication(authToken);
            LoggingContext.setUserId(user.getEmail());

            // Approval gate: isActive (hub-authoritative) is required for the secured DATA endpoints
            // (/api/pwa/secured/**), NOT for session maintenance (/auth/me, /auth/refresh). A pending-
            // approval user therefore keeps a working session + full access to the OPEN tier-1 endpoints
            // (work-request, JHA, field-list, inventory); only secured/plant features need approval.
            if (path.startsWith("/api/pwa/secured/") && !Boolean.TRUE.equals(user.getIsActive())) {
                sendError(response, 403, "ACCOUNT_INACTIVE", "Account not yet approved by administrator");
                return;
            }

            filterChain.doFilter(request, response);
        } catch (Exception e) {
            log.debug("[PWA JWT] Token validation failed: {}", e.getMessage());
            sendError(response, 401, "INVALID_TOKEN", "Token is invalid or expired");
        }
    }

    /**
     * Extract JWT from Authorization header (primary) or ?token= query param (for SSE/EventSource
     * which cannot send custom headers).
     */
    private String extractToken(HttpServletRequest request) {
        // 1. Standard Authorization header
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            return authHeader.substring(7);
        }

        // 2. Query parameter fallback (SSE — EventSource API cannot set headers)
        String queryToken = request.getParameter("token");
        if (queryToken != null && !queryToken.isBlank()) {
            return queryToken;
        }

        return null;
    }

    private boolean requiresJwt(String path) {
        for (String prefix : SECURED_PREFIXES) {
            if (path.startsWith(prefix)) return true;
        }
        return false;
    }

    private void sendError(HttpServletResponse response, int status, String error, String message) throws IOException {
        response.setStatus(status);
        response.setContentType("application/json");
        objectMapper.writeValue(response.getWriter(), Map.of("error", error, "message", message));
    }
}
