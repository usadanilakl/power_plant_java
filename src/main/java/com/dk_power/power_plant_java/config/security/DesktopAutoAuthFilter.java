package com.dk_power.power_plant_java.config.security;

import com.dk_power.power_plant_java.config.NetworkUtils;
import com.dk_power.power_plant_java.config.logging.LoggingContext;
import com.dk_power.power_plant_java.entities.users.User;
import com.dk_power.power_plant_java.repository.users.UserRepo;
import com.dk_power.power_plant_java.sevice.users.impl.CustomUserDetails;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Auto-authenticates requests from localhost using the OS username.
 * Only activates for loopback requests (127.0.0.1, ::1) when no session exists.
 * Reads System.getProperty("user.name") and matches against User.windowsUsername,
 * case-insensitively — Windows can report the same account with different casing
 * between logons, which would otherwise silently break auto-auth for that user.
 *
 * <p><b>Desktop only — deliberately not registered on the hub.</b> This grants a full
 * ROLE_ADMIN/ROLE_PLANT identity with no credential, on the strength of the request arriving over
 * loopback. On a desktop that is sound: loopback means a process on the operator's own machine.
 * The hub is published to the internet behind IIS, where the only thing separating outside traffic
 * from "local" traffic is that IIS adds forwarding headers and {@link NetworkUtils#isLoopbackRequest}
 * rejects anything carrying them. That works, but it makes a single reverse-proxy misconfiguration
 * — or any scheduled task, monitoring probe or SSRF running on the hub box — worth full admin.
 * The hub has no operator sitting at it, so the feature earns nothing there.
 *
 * <p>Disabled by {@code sync.role=hub} (set only in application-hub.properties). Desktops leave it
 * unset and are unaffected: Electron always talks to its own local instance on port 8082, so
 * operators still never see a login screen. The only behaviour change is that browsing to the hub's
 * own port from the hub console now asks for a password.
 *
 * <p>Note this is a RUNTIME gate rather than {@code @Profile("!hub")}: {@code SecurityConfigSpring}
 * injects this filter as a required constructor dependency, so removing the bean on the hub would
 * fail startup with NoSuchBeanDefinitionException. The bean stays registered everywhere; on the hub
 * it simply passes every request straight through.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DesktopAutoAuthFilter extends OncePerRequestFilter {

    /** "hub" on the central server (application-hub.properties); empty on desktops. */
    @Value("${sync.role:}")
    private String syncRole;

    private final UserRepo userRepo;
    private String cachedWindowsUsername;
    private User cachedUser;
    private long cacheTimestamp;
    private static final long CACHE_TTL_MS = 30_000; // Re-query every 30 seconds

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        // Never on the hub. See the class javadoc: the hub is internet-facing and has no operator
        // sitting at it, so granting admin on the strength of a loopback source address there is
        // all risk and no benefit.
        if ("hub".equalsIgnoreCase(syncRole)) {
            filterChain.doFilter(request, response);
            return;
        }

        // Only auto-auth for localhost requests
        if (!NetworkUtils.isLoopbackRequest(request)) {
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
        windowsUser = windowsUser.trim();

        // Look up user by windowsUsername (with TTL cache to avoid DB hit every request)
        User user;
        try {
            user = resolveUser(windowsUser);
        } catch (Exception e) {
            log.debug("Desktop auto-auth: DB lookup failed for '{}': {}", windowsUser, e.getMessage());
            filterChain.doFilter(request, response);
            return;
        }
        if (user == null || !Boolean.TRUE.equals(user.getIsActive())) {
            filterChain.doFilter(request, response);
            return;
        }

        // Guard against incomplete sync data (password/email may arrive in later batch)
        if (user.getEmail() == null || user.getEmail().isBlank()
                || user.getPassword() == null || user.getPassword().isBlank()
                || user.getRole() == null || user.getRole().isBlank()) {
            log.debug("Desktop auto-auth: user '{}' has incomplete data, skipping", user.getName());
            filterChain.doFilter(request, response);
            return;
        }

        // Only auto-auth users with ROLE_PLANT or ROLE_ADMIN
        if (!user.hasRole("ROLE_PLANT") && !user.hasRole("ROLE_ADMIN")) {
            log.debug("Desktop auto-auth: user '{}' has neither ROLE_PLANT nor ROLE_ADMIN, skipping", user.getName());
            filterChain.doFilter(request, response);
            return;
        }

        // Create authentication token
        try {
            Set<SimpleGrantedAuthority> authorities = user.getRoles().stream()
                    .map(SimpleGrantedAuthority::new)
                    .collect(Collectors.toSet());
            CustomUserDetails userDetails = new CustomUserDetails(user, authorities);
            UsernamePasswordAuthenticationToken auth =
                    new UsernamePasswordAuthenticationToken(userDetails, null, authorities);

            SecurityContextHolder.getContext().setAuthentication(auth);
            LoggingContext.setUserId(user.getEmail());
            log.debug("Desktop auto-auth: {} → user '{}'", windowsUser, user.getName());
        } catch (Exception e) {
            log.debug("Desktop auto-auth failed for user '{}': {}", user.getEmail(), e.getMessage());
            invalidateCache();
        }

        filterChain.doFilter(request, response);
    }

    private synchronized User resolveUser(String windowsUsername) {
        // Cache key is case-folded so a casing flip from Windows stays a cache hit rather than
        // forcing a re-query on the first request after every logon.
        String cacheKey = windowsUsername.toLowerCase(Locale.ROOT);
        long now = System.currentTimeMillis();
        if (cacheKey.equals(cachedWindowsUsername)
                && cachedUser != null
                && (now - cacheTimestamp) < CACHE_TTL_MS) {
            return cachedUser;
        }
        cachedUser = userRepo.findFirstByWindowsUsernameIgnoreCaseOrderByIdAsc(windowsUsername);
        if (cachedUser == null) {
            log.debug("Desktop auto-auth: no user with windowsUsername='{}' (case-insensitive)", windowsUsername);
        }
        cachedWindowsUsername = cacheKey;
        cacheTimestamp = now;
        return cachedUser;
    }

    private synchronized void invalidateCache() {
        cachedUser = null;
        cachedWindowsUsername = null;
        cacheTimestamp = 0;
    }
}
