package com.dk_power.power_plant_java.config.security;

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

    private static final Set<String> SECURED_PREFIXES = Set.of(
            "/api/pwa/secured/",
            "/api/pwa/auth/me",
            "/api/pwa/auth/refresh"
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

        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            sendError(response, 401, "MISSING_TOKEN", "Authorization header with Bearer token required");
            return;
        }

        String token = authHeader.substring(7);
        try {
            var claims = jwtService.validateToken(token);
            String email = claims.getSubject();

            User user = userRepo.findFirstByEmailOrderByIdAsc(email);
            if (user == null) {
                sendError(response, 401, "USER_NOT_FOUND", "User no longer exists");
                return;
            }

            if (!Boolean.TRUE.equals(user.getIsActive())) {
                sendError(response, 403, "ACCOUNT_INACTIVE", "Account not yet approved by administrator");
                return;
            }

            var authorities = Set.of(new SimpleGrantedAuthority(user.getRole()));
            var userDetails = new CustomUserDetails(user, authorities);
            var authToken = new UsernamePasswordAuthenticationToken(userDetails, null, authorities);
            SecurityContextHolder.getContext().setAuthentication(authToken);

            filterChain.doFilter(request, response);
        } catch (Exception e) {
            log.debug("[PWA JWT] Token validation failed: {}", e.getMessage());
            sendError(response, 401, "INVALID_TOKEN", "Token is invalid or expired");
        }
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
