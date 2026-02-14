package com.dk_power.power_plant_java.config.security;

import com.dk_power.power_plant_java.config.NetworkUtils;
import com.dk_power.power_plant_java.entities.users.User;
import com.dk_power.power_plant_java.repository.users.UserRepo;
import com.dk_power.power_plant_java.sevice.users.impl.CustomUserDetails;
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
import java.util.Set;

/**
 * Auto-authenticates requests from localhost using the OS username.
 * Only activates for loopback requests (127.0.0.1, ::1) when no session exists.
 * Reads System.getProperty("user.name") and matches against User.windowsUsername.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DesktopAutoAuthFilter extends OncePerRequestFilter {

    private final UserRepo userRepo;
    private String cachedWindowsUsername;
    private User cachedUser;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        // Only auto-auth for localhost requests
        if (!isLoopbackRequest(request)) {
            filterChain.doFilter(request, response);
            return;
        }

        // Skip if already authenticated
        if (SecurityContextHolder.getContext().getAuthentication() != null
                && SecurityContextHolder.getContext().getAuthentication().isAuthenticated()
                && !"anonymousUser".equals(SecurityContextHolder.getContext().getAuthentication().getPrincipal())) {
            filterChain.doFilter(request, response);
            return;
        }

        // Get the OS username
        String windowsUser = System.getProperty("user.name");
        if (windowsUser == null || windowsUser.isBlank()) {
            filterChain.doFilter(request, response);
            return;
        }

        // Look up user by windowsUsername (with simple cache to avoid DB hit every request)
        User user = resolveUser(windowsUser);
        if (user == null || !Boolean.TRUE.equals(user.getIsActive())) {
            filterChain.doFilter(request, response);
            return;
        }

        // Create authentication token
        Set<SimpleGrantedAuthority> authorities = Set.of(new SimpleGrantedAuthority(user.getRole()));
        CustomUserDetails userDetails = new CustomUserDetails(user, authorities);
        UsernamePasswordAuthenticationToken auth =
                new UsernamePasswordAuthenticationToken(userDetails, null, authorities);

        SecurityContextHolder.getContext().setAuthentication(auth);
        log.debug("Desktop auto-auth: {} → user '{}'", windowsUser, user.getName());

        filterChain.doFilter(request, response);
    }

    private boolean isLoopbackRequest(HttpServletRequest request) {
        String ip = NetworkUtils.getClientIp(request);
        return "127.0.0.1".equals(ip) || "0:0:0:0:0:0:0:1".equals(ip) || "::1".equals(ip);
    }

    private synchronized User resolveUser(String windowsUsername) {
        if (windowsUsername.equals(cachedWindowsUsername) && cachedUser != null) {
            return cachedUser;
        }
        cachedUser = userRepo.findByWindowsUsername(windowsUsername);
        cachedWindowsUsername = windowsUsername;
        return cachedUser;
    }
}
