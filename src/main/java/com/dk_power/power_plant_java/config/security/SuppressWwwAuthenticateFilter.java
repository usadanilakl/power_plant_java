package com.dk_power.power_plant_java.config.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpServletResponseWrapper;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collection;

/**
 * Strips WWW-Authenticate header from all responses to prevent the browser's
 * native login popup. This app uses a custom REST/JSON auth flow — the browser
 * should never prompt for credentials natively.
 *
 * Runs as the outermost filter (highest precedence) so it wraps the response
 * before any Spring Security filter can add the header.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class SuppressWwwAuthenticateFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        // Wrap response to silently suppress WWW-Authenticate header
        HttpServletResponseWrapper wrapper = new HttpServletResponseWrapper(response) {
            @Override
            public void setHeader(String name, String value) {
                if (!"WWW-Authenticate".equalsIgnoreCase(name)) {
                    super.setHeader(name, value);
                }
            }

            @Override
            public void addHeader(String name, String value) {
                if (!"WWW-Authenticate".equalsIgnoreCase(name)) {
                    super.addHeader(name, value);
                }
            }
        };

        filterChain.doFilter(request, wrapper);
    }
}
