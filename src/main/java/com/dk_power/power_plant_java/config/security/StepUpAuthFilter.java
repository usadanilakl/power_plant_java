package com.dk_power.power_plant_java.config.security;

import com.dk_power.power_plant_java.entities.users.User;
import com.dk_power.power_plant_java.repository.users.UserRepo;
import com.dk_power.power_plant_java.sevice.auth.StepUpTokenStore;
import com.dk_power.power_plant_java.sevice.users.impl.CustomUserDetails;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * When the request carries a valid {@code X-Sign-As-Token} header, swap the
 * {@link SecurityContextHolder} to the user the token was issued for, just for
 * that request. The original context is restored in a {@code finally} block,
 * so the session user A → action runs as B → response returns to A's session.
 *
 * <p>Tokens are single-use (consumed atomically by {@link StepUpTokenStore}).
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class StepUpAuthFilter extends OncePerRequestFilter {

    public static final String HEADER = "X-Sign-As-Token";

    private final StepUpTokenStore tokenStore;
    private final UserRepo userRepo;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String token = request.getHeader(HEADER);
        if (token == null || token.isBlank()) {
            filterChain.doFilter(request, response);
            return;
        }

        var consumed = tokenStore.consume(token);
        if (consumed.isEmpty()) {
            // Expired or unknown token. Don't swap; let normal auth handle the request
            // (which will likely fail with the existing 401/403). The caller can re-prompt.
            log.debug("Step-up token invalid or expired");
            filterChain.doFilter(request, response);
            return;
        }

        String stepUpUsername = consumed.get();
        User user = userRepo.findFirstByUsernameIgnoreCaseOrderByIdAsc(stepUpUsername);
        if (user == null || !Boolean.TRUE.equals(user.getIsActive())) {
            log.debug("Step-up user not found / inactive: {}", stepUpUsername);
            filterChain.doFilter(request, response);
            return;
        }

        SecurityContext originalContext = SecurityContextHolder.getContext();
        try {
            Set<SimpleGrantedAuthority> authorities = user.getRoles().stream()
                    .map(SimpleGrantedAuthority::new)
                    .collect(Collectors.toSet());
            CustomUserDetails details = new CustomUserDetails(user, authorities);
            Authentication auth = new UsernamePasswordAuthenticationToken(details, null, authorities);

            // Per-request context replacement (NOT the global context-holder strategy swap).
            SecurityContext stepUpContext = SecurityContextHolder.createEmptyContext();
            stepUpContext.setAuthentication(auth);
            SecurityContextHolder.setContext(stepUpContext);

            // Expose the original (session-holder) name as a request attribute so
            // downstream code can record dual-attribution if it wants to.
            String sessionHolder = originalContext != null && originalContext.getAuthentication() != null
                    ? originalContext.getAuthentication().getName() : null;
            request.setAttribute("stepUpSessionHolder", sessionHolder);
            request.setAttribute("stepUpActor", user.getUsername());

            log.debug("Step-up: request authenticated as '{}' (session holder: {})",
                    user.getUsername(), sessionHolder);

            filterChain.doFilter(request, response);
        } finally {
            SecurityContextHolder.setContext(originalContext);
        }
    }
}
