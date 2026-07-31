package com.dk_power.power_plant_java.config.security;

import com.dk_power.power_plant_java.config.NetworkUtils;
import com.dk_power.power_plant_java.config.logging.LoggingContext;
import com.dk_power.power_plant_java.entities.users.AccessGrant;
import com.dk_power.power_plant_java.entities.users.AccessGrant.GrantStatus;
import com.dk_power.power_plant_java.repository.users.AccessGrantRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.HandlerExecutionChain;
import org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerMapping;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.Set;

/**
 * Validates ACCESS_TOKEN cookie for endpoints requiring full web access.
 * Desktop (localhost) and LAN requests bypass this filter.
 * Only external authenticated requests to protected endpoints are checked.
 */
@Component
@Slf4j
public class AccessGrantFilter extends OncePerRequestFilter {

    private final AccessGrantRepository accessGrantRepository;
    private final ObjectMapper objectMapper;
    private final RequestMappingHandlerMapping handlerMapping;

    public AccessGrantFilter(AccessGrantRepository accessGrantRepository,
                             ObjectMapper objectMapper,
                             @Qualifier("requestMappingHandlerMapping") RequestMappingHandlerMapping handlerMapping) {
        this.accessGrantRepository = accessGrantRepository;
        this.objectMapper = objectMapper;
        this.handlerMapping = handlerMapping;
    }

    public static final String ACCESS_TOKEN_COOKIE = "ACCESS_TOKEN";

    // Endpoints that DON'T require full access (public, auth, restricted-tier)
    private static final Set<String> EXEMPT_PREFIXES = Set.of(
            "/api/auth/",
            "/api/pwa/",
            // Chat auth endpoint is shared between Electron (localhost auto-auth) and PWA
            // (JWT via PwaJwtAuthFilter). Off-LAN PWA callers otherwise hit this filter's
            // ACCESS_TOKEN cookie check and get 403 FULL_ACCESS_REQUIRED even though the JWT is
            // valid. PwaJwtAuthFilter is now the auth gate for /api/chat/**; the cookie check
            // here would just double-gate it and lock out PWA users.
            "/api/chat/",
            "/api/sharepoint-sync/",
            "/power-automate/",
            "/actuator/",
            "/app/",
            // LAN-only endpoints are handled by SecurityFilterChain IP check, not this filter
            "/api/sync/",
            "/api/field-sync/",
            "/api/resync/",
            "/api/files/",
            "/api/update/",
            "/api/electron-update/",
            "/api/resource-packs/",
            "/api/sync-updates/",
            "/api/data-integrity/",
            "/api/attachments/",
            "/h2-console/",
            "/work-requests-api/heal-snapshot"
    );

    // Static resources
    private static final Set<String> STATIC_PREFIXES = Set.of(
            "/angular/", "/bootstrap-", "/functions/", "/interact.js-main/",
            "/my_styles/", "/background/", "/uploads/",
            "/favicon", "/assets/"
    );

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String path = request.getRequestURI();

        // Skip for exempt endpoints
        if (isExempt(path)) {
            filterChain.doFilter(request, response);
            return;
        }

        // Skip for localhost requests (desktop auto-auth has full access)
        if (NetworkUtils.isLoopbackRequest(request)) {
            filterChain.doFilter(request, response);
            return;
        }

        // Skip for LAN requests (internal network has full access)
        if (NetworkUtils.isInternalRequest(request)) {
            filterChain.doFilter(request, response);
            return;
        }

        // At this point: external request to a protected endpoint.
        // Must have a valid session AND a valid ACCESS_TOKEN (regardless of role).
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            // Not authenticated — Spring Security will handle 401
            filterChain.doFilter(request, response);
            return;
        }

        // Check if the target handler is annotated with @RestrictedAllowed
        // (restricted external users can access these without a grant)
        if (isRestrictedAllowed(request)) {
            filterChain.doFilter(request, response);
            return;
        }

        // Check ACCESS_TOKEN cookie
        String accessToken = getAccessTokenFromCookie(request);
        if (accessToken == null) {
            sendFullAccessRequired(request, response, "No access token. Request full access from an administrator.");
            return;
        }

        // Validate the grant
        var grantOpt = accessGrantRepository.findByAccessToken(accessToken);
        if (grantOpt.isEmpty()) {
            sendFullAccessRequired(request, response, "Invalid access token.");
            return;
        }

        AccessGrant grant = grantOpt.get();
        LoggingContext.setUserId(grant.getUser() != null ? grant.getUser().getEmail() : null);

        if (grant.getStatus() != GrantStatus.APPROVED) {
            log.info("security.access.denied status={} path={}", grant.getStatus(), path);
            sendFullAccessRequired(request, response, "Access grant is " + grant.getStatus().name().toLowerCase() + ".");
            return;
        }

        LocalDateTime now = LocalDateTime.now();

        if (grant.getExpiresAt() != null && now.isAfter(grant.getExpiresAt())) {
            grant.setStatus(GrantStatus.EXPIRED);
            accessGrantRepository.save(grant);
            log.info("security.access.denied status=expired path={}", path);
            sendFullAccessRequired(request, response, "Access grant has expired (24h maximum).");
            return;
        }

        if (grant.getLastActiveAt() != null && now.isAfter(grant.getLastActiveAt().plusHours(1))) {
            grant.setStatus(GrantStatus.EXPIRED);
            accessGrantRepository.save(grant);
            log.info("security.access.denied status=inactive_timeout path={}", path);
            sendFullAccessRequired(request, response, "Access grant expired due to inactivity (1 hour).");
            return;
        }

        // Update lastActiveAt (throttled: only if >5 min since last update)
        if (grant.getLastActiveAt() == null || now.isAfter(grant.getLastActiveAt().plusMinutes(5))) {
            grant.setLastActiveAt(now);
            accessGrantRepository.save(grant);
        }

        log.debug("security.access.allowed path={} grantId={}", path, grant.getId());

        filterChain.doFilter(request, response);
    }

    private boolean isExempt(String path) {
        for (String prefix : EXEMPT_PREFIXES) {
            if (path.startsWith(prefix)) return true;
        }
        for (String prefix : STATIC_PREFIXES) {
            if (path.startsWith(prefix)) return true;
        }
        return false;
    }

    private String getAccessTokenFromCookie(HttpServletRequest request) {
        if (request.getCookies() == null) return null;
        for (Cookie cookie : request.getCookies()) {
            if (ACCESS_TOKEN_COOKIE.equals(cookie.getName())) {
                return cookie.getValue();
            }
        }
        return null;
    }

    /**
     * Check if the target handler method/class is annotated with @RestrictedAllowed.
     * Fails closed: if handler can't be resolved, returns false (requires full access).
     */
    private boolean isRestrictedAllowed(HttpServletRequest request) {
        try {
            HandlerExecutionChain chain = handlerMapping.getHandler(request);
            if (chain == null) return false;

            Object handler = chain.getHandler();
            if (!(handler instanceof HandlerMethod handlerMethod)) return false;

            // Method-level annotation takes priority
            if (handlerMethod.getMethodAnnotation(RestrictedAllowed.class) != null) return true;

            // Fall back to class-level annotation
            return handlerMethod.getBeanType().getAnnotation(RestrictedAllowed.class) != null;
        } catch (Exception e) {
            log.warn("Could not resolve handler for restricted-access check: {}", e.getMessage());
            return false;
        }
    }

    private void sendFullAccessRequired(HttpServletRequest request, HttpServletResponse response, String message) throws IOException {
        // Browser page navigation → redirect to Angular access-request page
        String accept = request.getHeader("Accept");
        if (accept != null && accept.contains("text/html")) {
            response.sendRedirect("/app/access-request");
            return;
        }
        // API/AJAX request → JSON error
        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
        response.setContentType("application/json");
        objectMapper.writeValue(response.getWriter(),
                Map.of("error", "FULL_ACCESS_REQUIRED", "message", message));
    }
}
