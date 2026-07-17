package com.dk_power.power_plant_java.config;

import com.dk_power.power_plant_java.sevice.sync.RequestClientIdContext;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Reads the {@code X-Client-Id} header stamped by the Angular
 * {@code clientIdInterceptor} and stashes it on {@link RequestClientIdContext}
 * for the duration of the request.
 * <p>
 * Runs at the highest precedence so the id is available before any downstream
 * filter or controller runs. Cleared in a {@code finally} so the ThreadLocal
 * never leaks — Tomcat's thread-pool reuse would otherwise poison a later
 * request from an unrelated tab.
 * <p>
 * Empty / missing header is fine — {@code currentOrNull()} returns null and
 * the event carries {@code originClientId == null}, matching how background
 * writes (jobs, SP pulls, curl) look downstream.
 */
@Component
@RequiredArgsConstructor
@Order(Ordered.HIGHEST_PRECEDENCE)
public class ClientIdRequestFilter extends OncePerRequestFilter {

    private static final String HEADER = "X-Client-Id";

    private final RequestClientIdContext clientIdContext;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                     HttpServletResponse response,
                                     FilterChain chain) throws ServletException, IOException {
        String headerValue = request.getHeader(HEADER);
        if (headerValue != null && !headerValue.isBlank()) {
            clientIdContext.set(headerValue.trim());
        }
        try {
            chain.doFilter(request, response);
        } finally {
            clientIdContext.clear();
        }
    }
}
