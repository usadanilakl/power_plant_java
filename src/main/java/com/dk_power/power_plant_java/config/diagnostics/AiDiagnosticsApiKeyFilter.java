package com.dk_power.power_plant_java.config.diagnostics;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.security.web.authentication.preauth.PreAuthenticatedAuthenticationToken;

import java.io.IOException;
import java.util.Locale;
import java.util.Map;

/**
 * Bearer service-key authentication for the isolated AI diagnostics path.
 * Query-string credentials are deliberately rejected.
 */
@Component
@Slf4j
public class AiDiagnosticsApiKeyFilter extends OncePerRequestFilter {

    public static final String BASE_PATH = "/ng/ai-diagnostics/v1";
    public static final String IDENTITY_ATTRIBUTE = AiDiagnosticsApiKeyFilter.class.getName() + ".identity";

    private final AiDiagnosticsProperties properties;
    private final AiDiagnosticsApiKeyAuthenticator authenticator;
    private final ObjectMapper objectMapper;

    public AiDiagnosticsApiKeyFilter(
        AiDiagnosticsProperties properties,
        AiDiagnosticsApiKeyAuthenticator authenticator,
        ObjectMapper objectMapper
    ) {
        this.properties = properties;
        this.authenticator = authenticator;
        this.objectMapper = objectMapper;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return !(BASE_PATH.equals(path) || path.startsWith(BASE_PATH + "/"));
    }

    @Override
    protected void doFilterInternal(
        HttpServletRequest request,
        HttpServletResponse response,
        FilterChain filterChain
    ) throws ServletException, IOException {
        // Apply to successes and all early authentication/error responses.
        response.setHeader("Cache-Control", "no-store");
        response.setHeader("Pragma", "no-cache");
        if (!properties.isEnabled()) {
            response.sendError(HttpServletResponse.SC_NOT_FOUND);
            return;
        }
        if (request.getParameter("token") != null) {
            sendUnauthorized(response, "QUERY_CREDENTIAL_REJECTED",
                "Credentials must be sent in the Authorization header");
            return;
        }

        String rawApiKey = bearerToken(request.getHeader("Authorization"));
        if (rawApiKey == null) {
            sendUnauthorized(response, "MISSING_SERVICE_KEY",
                "Authorization header with a Bearer service key is required");
            return;
        }

        var principal = authenticator.authenticate(rawApiKey);
        if (principal.isEmpty()) {
            // Per-attempt INFO/WARN logging lets unauthenticated traffic force log rotation.
            // Query/stream/bundle accesses are audited after successful authentication.
            log.debug("security.ai_diagnostics.authentication_denied path={}", request.getRequestURI());
            sendUnauthorized(response, "INVALID_SERVICE_KEY", "Service key is invalid or disabled");
            return;
        }

        AiDiagnosticsPrincipal servicePrincipal = principal.get();
        var authorities = servicePrincipal.scopes().stream()
            .map(AiDiagnosticsScope::authority)
            .map(SimpleGrantedAuthority::new)
            .toList();
        Authentication authentication = new PreAuthenticatedAuthenticationToken(
            servicePrincipal, null, authorities);

        SecurityContext originalContext = SecurityContextHolder.getContext();
        SecurityContext serviceContext = SecurityContextHolder.createEmptyContext();
        serviceContext.setAuthentication(authentication);
        SecurityContextHolder.setContext(serviceContext);
        request.setAttribute(IDENTITY_ATTRIBUTE, servicePrincipal.identity());

        log.debug("security.ai_diagnostics.authentication_allowed identity={} path={}",
            servicePrincipal.identity(), request.getRequestURI());
        try {
            filterChain.doFilter(request, response);
        } finally {
            SecurityContextHolder.setContext(originalContext);
        }
    }

    private String bearerToken(String authorization) {
        if (authorization == null) {
            return null;
        }
        int separator = authorization.indexOf(' ');
        if (separator <= 0 || !"bearer".equals(authorization.substring(0, separator).toLowerCase(Locale.ROOT))) {
            return null;
        }
        String value = authorization.substring(separator + 1).trim();
        return value.isEmpty() || value.indexOf(' ') >= 0 ? null : value;
    }

    private void sendUnauthorized(HttpServletResponse response, String error, String message) throws IOException {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType("application/json");
        objectMapper.writeValue(response.getWriter(), Map.of("error", error, "message", message));
    }
}
