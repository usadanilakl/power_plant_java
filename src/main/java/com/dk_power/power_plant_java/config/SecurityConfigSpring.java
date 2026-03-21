package com.dk_power.power_plant_java.config;

import com.dk_power.power_plant_java.config.security.AccessGrantFilter;
import com.dk_power.power_plant_java.config.security.DesktopAutoAuthFilter;
import com.dk_power.power_plant_java.config.security.PwaJwtAuthFilter;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.util.matcher.RequestMatcher;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;
import java.util.Map;

import org.springframework.core.annotation.Order;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfigSpring {

    private final DesktopAutoAuthFilter desktopAutoAuthFilter;
    private final AccessGrantFilter accessGrantFilter;
    private final PwaJwtAuthFilter pwaJwtAuthFilter;

    @Value("${security.cors.allowed-origins:http://localhost:*,https://dk-power.github.io,https://*.loclx.io}")
    private String allowedOrigins;

    /**
     * Separate filter chain for static resources — completely bypasses security processing.
     * No CORS, CSRF, session, or custom filters run for these paths.
     * This is needed because Angular uses &lt;script type="module"&gt; which sends
     * an Origin header, and CorsProcessor rejects tunnel/proxy origins before
     * AccessGrantFilter or permitAll() ever get a chance to run.
     */
    @Bean
    @Order(0)
    public SecurityFilterChain staticResourcesChain(HttpSecurity http) throws Exception {
        http
            .securityMatcher(
                "/angular/**", "/app/**", "/assets/**",
                "/bootstrap-5.3.3-dist/**", "/functions/**",
                "/interact.js-main/**", "/my_styles/**",
                "/background/**", "/uploads/**", "/favicon.ico"
            )
            .authorizeHttpRequests(auth -> auth.anyRequest().permitAll())
            .csrf(csrf -> csrf.disable())
            .cors(cors -> cors.disable())
            .headers(headers -> headers.frameOptions(frame -> frame.disable()));
        return http.build();
    }

    @Bean
    @Order(1)
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))

            // Disable HTTP Basic auth and form login (prevents browser's native login popup
            // and Spring's default login page — we use a custom REST/JSON auth flow)
            .httpBasic(basic -> basic.disable())
            .formLogin(form -> form.disable())

            // Session management
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED)
                .maximumSessions(-1)
            )

            // CSRF: disabled for API/sync endpoints
            .csrf(csrf -> csrf.ignoringRequestMatchers(
                "/api/**", "/ng/**", "/power-automate/**",
                "/h2-console/**", "/browser/**", "/print/**",
                "/work-request/**", "/work-requests-api/**",
                "/api-lotos/**", "/red-tag-controls/**",
                "/jha-api/**", "/images-api/**", "/server/**"
            ))

            // Frame options for h2-console
            .headers(headers -> headers.frameOptions(frame -> frame.disable()))

            // Authorization rules
            .authorizeHttpRequests(auth -> auth
                // PWA secured endpoints — JWT auth handled by PwaJwtAuthFilter
                .requestMatchers("/api/pwa/secured/**").authenticated()
                .requestMatchers("/api/pwa/auth/me", "/api/pwa/auth/refresh").authenticated()

                // Public endpoints — no auth required
                .requestMatchers(
                    "/api/auth/login", "/api/auth/logout", "/api/auth/me",
                    "/api/auth/forgot-password", "/api/auth/reset-password",
                    "/api/pwa/**",
                    "/api/sharepoint-sync/**", "/power-automate/**",
                    "/actuator/health",
                    "/qr/**",
                    "/app/**", "/angular/**",
                    "/", "/home", "/login",
                    "/bootstrap-5.3.3-dist/**", "/functions/**",
                    "/interact.js-main/**", "/my_styles/**",
                    "/background/**", "/uploads/**",
                    "/favicon.ico", "/assets/**"
                ).permitAll()

                // LAN-only endpoints — only internal IPs can access
                .requestMatchers(lanOnlyMatcher(
                    "/api/sync/", "/api/field-sync/", "/api/resync/",
                    "/api/files/", "/api/update/", "/api/electron-update/",
                    "/api/resource-packs/", "/api/sync-updates/",
                    "/api/sync-test/", "/api/sync-e2e/",
                    "/api/data-integrity/", "/api/backup/",
                    "/api/attachments/",
                    "/h2-console/"
                )).permitAll()

                // Admin-only endpoints — admin grant approval is localhost-only
                .requestMatchers(localhostMatcher("/api/auth/admin/")).hasRole("ADMIN")
                .requestMatchers("/api/auth/admin/**").denyAll() // Block non-localhost
                .requestMatchers("/admin/**").hasRole("ADMIN")
                .requestMatchers("/users/**").hasRole("ADMIN")
                .requestMatchers("/ng/users/**").hasRole("ADMIN")

                // Auth endpoints (must be logged in)
                .requestMatchers("/api/auth/**").authenticated()

                // Everything else requires authentication
                // (AccessGrantFilter handles full-access check for external requests)
                .anyRequest().authenticated()
            )

            // REST-based auth: return JSON instead of redirect
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint((request, response, authException) -> {
                    response.setStatus(401);
                    response.setContentType("application/json");
                    new ObjectMapper().writeValue(response.getWriter(),
                        Map.of("error", "UNAUTHORIZED", "message", "Authentication required"));
                })
                .accessDeniedHandler((request, response, accessDeniedException) -> {
                    response.setStatus(403);
                    response.setContentType("application/json");
                    new ObjectMapper().writeValue(response.getWriter(),
                        Map.of("error", "ACCESS_DENIED", "message", "Insufficient permissions"));
                })
            )

            // Logout
            .logout(logout -> logout
                .logoutUrl("/api/auth/logout")
                .logoutSuccessHandler((request, response, authentication) -> {
                    response.setStatus(200);
                    response.setContentType("application/json");
                    new ObjectMapper().writeValue(response.getWriter(),
                        Map.of("success", true, "message", "Logged out"));
                })
                .deleteCookies("JSESSIONID", "ACCESS_TOKEN")
            )

            // Custom filters — order: PwaJwt → DesktopAuto → UsernamePassword → AccessGrant
            // Both custom pre-auth filters anchored to UsernamePasswordAuthenticationFilter.
            // PwaJwtAuthFilter self-skips non-PWA paths; DesktopAutoAuthFilter self-skips non-desktop paths.
            .addFilterBefore(desktopAutoAuthFilter, UsernamePasswordAuthenticationFilter.class)
            .addFilterBefore(pwaJwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
            .addFilterAfter(accessGrantFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        List<String> origins = Arrays.asList(allowedOrigins.split(","));
        configuration.setAllowedOriginPatterns(origins.stream().map(String::trim).toList());
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList(
            "authorization", "content-type", "x-auth-token",
            "X-Machine-Id", "X-Machine-Name", "X-Device-Number"
        ));
        configuration.setExposedHeaders(Arrays.asList("x-auth-token"));
        configuration.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    /**
     * RequestMatcher that allows requests ONLY from localhost (loopback)
     * for the specified URL path prefixes.
     */
    private RequestMatcher localhostMatcher(String... prefixes) {
        return (HttpServletRequest request) -> {
            String path = request.getRequestURI();
            boolean pathMatches = false;
            for (String prefix : prefixes) {
                if (path.startsWith(prefix)) {
                    pathMatches = true;
                    break;
                }
            }
            if (!pathMatches) return false;
            return NetworkUtils.isLoopbackRequest(request);
        };
    }

    /**
     * RequestMatcher that allows requests ONLY from internal/LAN IPs
     * for the specified URL path prefixes. External IPs are denied.
     */
    private RequestMatcher lanOnlyMatcher(String... prefixes) {
        return (HttpServletRequest request) -> {
            String path = request.getRequestURI();
            boolean pathMatches = false;
            for (String prefix : prefixes) {
                if (path.startsWith(prefix)) {
                    pathMatches = true;
                    break;
                }
            }
            if (!pathMatches) return false;
            return NetworkUtils.isInternalRequest(request);
        };
    }
}
