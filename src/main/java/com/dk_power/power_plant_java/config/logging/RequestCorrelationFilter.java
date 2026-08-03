package com.dk_power.power_plant_java.config.logging;

import com.dk_power.power_plant_java.config.NetworkUtils;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Set;
import java.util.regex.Pattern;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
@Slf4j
public class RequestCorrelationFilter extends OncePerRequestFilter {

    private static final int MAX_REQUEST_ID_LENGTH = 128;
    private static final Pattern SAFE_REQUEST_ID = Pattern.compile("[A-Za-z0-9._:-]{1," + MAX_REQUEST_ID_LENGTH + "}");

    @Value("${logging.http.slow-request-ms:3000}")
    private long slowRequestMs;

    @Value("${logging.http.include-client-errors:true}")
    private boolean includeClientErrors;

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

        long startNanos = System.nanoTime();
        String requestId = normalizeRequestId(request.getHeader("X-Request-Id"));
        String remoteIp = NetworkUtils.getClientIp(request);

        LoggingContext.put(LoggingContext.REQUEST_ID, requestId);
        LoggingContext.put(LoggingContext.METHOD, request.getMethod());
        LoggingContext.put(LoggingContext.PATH, request.getRequestURI());
        LoggingContext.put(LoggingContext.REMOTE_IP, remoteIp);
        LoggingContext.put(LoggingContext.MACHINE_ID, normalizeContextId(request.getHeader("X-Machine-Id")));
        response.setHeader("X-Request-Id", requestId);

        boolean tracedRequest = isTracedRequest(request.getRequestURI());
        if (tracedRequest) {
            log.debug("http.request.start method={} path={}", request.getMethod(), request.getRequestURI());
        }

        try {
            filterChain.doFilter(request, response);
        } catch (Exception e) {
            long durationMs = elapsedMillis(startNanos);
            String userId = resolveUserId();
            LoggingContext.setUserId(userId);
            log.error("http.request.failed method={} path={} status=500 durationMs={} userId={} remoteIp={} exception={}",
                request.getMethod(),
                request.getRequestURI(),
                durationMs,
                userId,
                remoteIp,
                e.getClass().getSimpleName(),
                e);
            throw e;
        } finally {
            if (tracedRequest) {
                long durationMs = elapsedMillis(startNanos);
                int status = response.getStatus();
                String userId = resolveUserId();
                LoggingContext.setUserId(userId);

                if (status >= 500) {
                    log.warn("http.request.complete method={} path={} status={} durationMs={} userId={}",
                        request.getMethod(), request.getRequestURI(), status, durationMs, userId);
                } else if ((includeClientErrors && status >= 400) || durationMs >= slowRequestMs) {
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

    private String normalizeRequestId(String candidate) {
        if (candidate == null) {
            return LoggingContext.shortId("req");
        }
        String trimmed = candidate.trim();
        if (!SAFE_REQUEST_ID.matcher(trimmed).matches()) {
            return LoggingContext.shortId("req");
        }
        return trimmed;
    }

    private String normalizeContextId(String candidate) {
        if (candidate == null) {
            return null;
        }
        String trimmed = candidate.trim();
        return SAFE_REQUEST_ID.matcher(trimmed).matches() ? trimmed : null;
    }

    private long elapsedMillis(long startNanos) {
        return (System.nanoTime() - startNanos) / 1_000_000L;
    }

    private boolean isTracedRequest(String path) {
        // Diagnostics polling/streaming has its own access audit. Excluding it here avoids a
        // self-observing feedback loop where reading the log continuously creates more log events.
        if (path.equals("/ng/log-diagnostics") || path.startsWith("/ng/log-diagnostics/")
            || path.equals("/ng/ai-diagnostics") || path.startsWith("/ng/ai-diagnostics/")) {
            return false;
        }
        return path.startsWith("/api/") || path.startsWith("/ng/")
            || path.startsWith("/actuator/") || path.startsWith("/h2-console/");
    }

    private String resolveUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return MDC.get(LoggingContext.USER_ID);
        }
        Object principal = authentication.getPrincipal();
        if (principal == null) {
            return MDC.get(LoggingContext.USER_ID);
        }
        return "anonymousUser".equals(principal)
            ? MDC.get(LoggingContext.USER_ID)
            : authentication.getName();
    }
}
