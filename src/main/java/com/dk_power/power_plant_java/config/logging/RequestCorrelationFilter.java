package com.dk_power.power_plant_java.config.logging;

import com.dk_power.power_plant_java.config.NetworkUtils;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Set;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
@Slf4j
public class RequestCorrelationFilter extends OncePerRequestFilter {

    private static final Set<String> STATIC_PREFIXES = Set.of(
        "/angular/", "/app/", "/assets/", "/bootstrap-", "/functions/",
        "/interact.js-main/", "/my_styles/", "/background/", "/uploads/",
        "/favicon.ico"
    );

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        for (String prefix : STATIC_PREFIXES) {
            if (path.startsWith(prefix)) {
                return true;
            }
        }
        return false;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
        throws ServletException, IOException {

        long start = System.currentTimeMillis();
        String requestId = request.getHeader("X-Request-Id");
        if (requestId == null || requestId.isBlank()) {
            requestId = LoggingContext.shortId("req");
        }

        LoggingContext.put(LoggingContext.REQUEST_ID, requestId);
        LoggingContext.put(LoggingContext.METHOD, request.getMethod());
        LoggingContext.put(LoggingContext.PATH, request.getRequestURI());
        LoggingContext.put(LoggingContext.REMOTE_IP, NetworkUtils.getClientIp(request));
        LoggingContext.put(LoggingContext.MACHINE_ID, request.getHeader("X-Machine-Id"));

        boolean tracedRequest = isTracedRequest(request.getRequestURI());
        if (tracedRequest) {
            log.debug("http.request.start method={} path={}", request.getMethod(), request.getRequestURI());
        }

        try {
            filterChain.doFilter(request, response);
        } catch (Exception e) {
            long durationMs = System.currentTimeMillis() - start;
            String userId = resolveUserId();
            LoggingContext.setUserId(userId);
            log.error("http.request.failed method={} path={} status=500 durationMs={} userId={} remoteIp={} exception={} error={}",
                request.getMethod(),
                request.getRequestURI(),
                durationMs,
                userId,
                NetworkUtils.getClientIp(request),
                e.getClass().getSimpleName(),
                e.getMessage());
            throw e;
        } finally {
            if (tracedRequest) {
                long durationMs = System.currentTimeMillis() - start;
                int status = response.getStatus();
                String userId = resolveUserId();
                LoggingContext.setUserId(userId);

                if (status >= 500) {
                    log.warn("http.request.complete method={} path={} status={} durationMs={} userId={}",
                        request.getMethod(), request.getRequestURI(), status, durationMs, userId);
                } else if (status >= 400 || durationMs >= 3000) {
                    log.info("http.request.complete method={} path={} status={} durationMs={} userId={}",
                        request.getMethod(), request.getRequestURI(), status, durationMs, userId);
                } else {
                    log.debug("http.request.complete method={} path={} status={} durationMs={} userId={}",
                        request.getMethod(), request.getRequestURI(), status, durationMs, userId);
                }
            }

            LoggingContext.remove(LoggingContext.USER_ID);
            LoggingContext.remove(LoggingContext.MACHINE_ID);
            LoggingContext.remove(LoggingContext.REMOTE_IP);
            LoggingContext.remove(LoggingContext.PATH);
            LoggingContext.remove(LoggingContext.METHOD);
            LoggingContext.remove(LoggingContext.REQUEST_ID);
        }
    }

    private boolean isTracedRequest(String path) {
        return path.startsWith("/api/") || path.startsWith("/actuator/") || path.startsWith("/h2-console/");
    }

    private String resolveUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return null;
        }
        Object principal = authentication.getPrincipal();
        if (principal == null) {
            return null;
        }
        return "anonymousUser".equals(principal) ? null : principal.toString();
    }
}
