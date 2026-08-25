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
    private final com.dk_power.power_plant_java.config.security.StepUpAuthFilter stepUpAuthFilter;
    private final com.dk_power.power_plant_java.config.diagnostics.AiDiagnosticsApiKeyFilter aiDiagnosticsApiKeyFilter;

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
                // Isolated, read-only service credentials for AI troubleshooting.
                .requestMatchers("/ng/ai-diagnostics/v1/events/stream").hasAuthority("SCOPE_logs:stream")
                .requestMatchers("/ng/ai-diagnostics/v1/events", "/ng/ai-diagnostics/v1/events/**")
                    .hasAuthority("SCOPE_logs:read")
                .requestMatchers("/ng/ai-diagnostics/v1/bundles", "/ng/ai-diagnostics/v1/bundles/**")
                    .hasAuthority("SCOPE_diagnostics:bundle")
                .requestMatchers("/ng/ai-diagnostics/v1/**").denyAll()
                // PWA secured endpoints — JWT auth handled by PwaJwtAuthFilter
                // Mobile LOTO Standards (Plant-only). The PWA JWT principal carries ROLE_PLANT from the DB,
                // so hasAnyRole works reliably here (must precede the generic /secured/** authenticated rule).
                // Plant-group-gated read APIs (schedule + contacts) — see project/features/users/communication/pwa-step-5-wiring.md
                .requestMatchers("/api/pwa/secured/schedule/**").hasAnyRole("ADMIN", "PLANT", "NAES", "JPOWER")
                .requestMatchers("/api/pwa/secured/contacts/**").hasAnyRole("ADMIN", "PLANT", "NAES", "JPOWER")
                // Contractor directory — same audience as contacts; it is contractor personal data.
                .requestMatchers("/api/pwa/secured/contractors/**").hasAnyRole("ADMIN", "PLANT", "NAES", "JPOWER")
                .requestMatchers("/api/pwa/secured/loto-standards/**").hasAnyRole("PLANT", "ADMIN")
                .requestMatchers("/api/pwa/secured/loto-points/**").hasAnyRole("PLANT", "ADMIN")
                .requestMatchers("/api/pwa/secured/loto/**").hasAnyRole("PLANT", "ADMIN")
                // Scanned-QR tag resolver + drawing/connector lookup (PwaQrController). Same bar as the LOTO
                // endpoints above: the /qr/{tag} redirect on the hub is public so any phone camera can follow
                // it, but the P&IDs behind it are plant data. Without this rule it would fall through to
                // /api/pwa/secured/** .authenticated(), which would hand drawings to any signed-in contractor.
                .requestMatchers("/api/pwa/secured/qr/**").hasAnyRole("PLANT", "ADMIN")
                // Qualifications: the target model is READ-ONLY for plant staff, writable by ROLE_SAFETY.
                // Reads are @GetMapping and writes are POST/PUT/DELETE under this path, so method-scoped
                // matchers split the two (the GET rule must precede the write rule — first match wins).
                //
                // PLANT is still on the WRITE rule on purpose: ROLE_SAFETY was only just introduced and
                // nobody holds it yet, so removing PLANT here would break qualification editing for
                // every non-admin the moment this deploys. Drop "PLANT" from the write rule once the
                // safety staff have been granted ROLE_SAFETY in the admin user screen.
                .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/pwa/secured/qualifications/**").hasAnyRole("PLANT", "SAFETY", "ADMIN")
                .requestMatchers("/api/pwa/secured/qualifications/**").hasAnyRole("PLANT", "SAFETY", "ADMIN")
                // Field List submission and retrieval (walkdown reports, insulation etc.). Formerly
                // anonymous under /api/pwa/** — now plant-only because submissions route to Maximo
                // as SR/WO and unauthenticated writes would let anyone create Maximo records.
                // Insulation contractors get read/close via the dedicated /insulation path below,
                // NOT via /field-list-item — they should not be creating new items.
                .requestMatchers("/api/pwa/field-list-item/**").hasAnyRole("PLANT", "ADMIN")
                // Instrumentation register + logs carry their OWN role rather than riding on ROLE_PLANT:
                // the whole point of ROLE_INSTRUMENTATION is that an admin grants it per user (I&C techs,
                // contractors doing calibration work), so granting it implicitly to every plant operator
                // would make the role meaningless. ADMIN is included as the usual superuser escape hatch.
                .requestMatchers("/api/pwa/secured/instruments/**").hasAnyRole("INSTRUMENTATION", "ADMIN")
                .requestMatchers("/api/pwa/secured/instrument-log/**").hasAnyRole("INSTRUMENTATION", "ADMIN")
                // Insulation contractor view — same per-user-granted-role model as INSTRUMENTATION.
                // PLANT + ADMIN are included so plant supervisors can see the queue and close on
                // behalf of a contractor if needed. Contractors CAN'T submit new field lists via
                // this path (they close existing WO-routed insulation items only) — the submit
                // path lives at /api/pwa/field-list-item/** and is PLANT+ADMIN only.
                .requestMatchers("/api/pwa/secured/insulation/**").hasAnyRole("INSULATION", "PLANT", "ADMIN")
                // Field-list drift signals for the PWA — same audience as the two writer paths above:
                // plant submitters and insulation contractors both see drift badges on their list views
                // (resolution lives in the JG Portal admin drift panel; this endpoint is read-only).
                .requestMatchers("/api/pwa/secured/field-list-drift/**").hasAnyRole("INSULATION", "PLANT", "ADMIN")
                // Read-only KIOSK role: an unattended display (e.g. a wall monitor whose own network can't
                // reach Maximo) may GET Maximo data (the PM overview) but never write. Reads are @GetMapping
                // and writes @PostMapping under this path, so a method-scoped matcher grants KIOSK read-only.
                // Must precede the generic maximo rule below (first match wins), which still denies KIOSK on writes.
                .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/pwa/secured/maximo/**").hasAnyRole("PLANT", "ADMIN", "KIOSK")
                .requestMatchers("/api/pwa/secured/maximo/**").hasAnyRole("PLANT", "ADMIN")
                // Coverage signup: a kiosk (otherwise read-only) may GET open coverage so a wall
                // display can show open seats. POST (signup) is deliberately NOT granted to KIOSK —
                // the shared kiosk JWT identifies the display, not the individual signing up, so a
                // KIOSK POST would be misattributed (or simply dead, since nobody can drive it
                // meaningfully). Kiosk PIN step-up (identify the individual via the
                // X-Sign-As-Token / StepUpAuthFilter path, see PwaCoverageController javadoc) is the
                // planned Phase 3B route back to kiosk signup — wire it there, not here.
                .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/pwa/secured/coverage-signup/**").hasAnyRole("PLANT", "ADMIN", "KIOSK")
                .requestMatchers(org.springframework.http.HttpMethod.POST, "/api/pwa/secured/coverage-signup/**").hasAnyRole("PLANT", "ADMIN")
                // Inventory and SDS were anonymous under the retired tier-1 model, where the PWA
                // treated a name typed into localStorage as an identity. Both are plant data that
                // now sits behind sign-in in the nav (see nav.model.ts), so the API must agree —
                // otherwise the menu hides them while the endpoint still serves anyone who asks.
                // Work Request and JHA stay anonymous on purpose: a contractor must be able to
                // submit one before anybody has approved them for anything.
                .requestMatchers("/api/pwa/inventory-item/**").hasAnyRole("PLANT", "ADMIN")
                .requestMatchers("/api/pwa/sds-chemical/**").hasAnyRole("PLANT", "ADMIN")
                .requestMatchers("/api/pwa/sds-audit/**").hasAnyRole("PLANT", "ADMIN")
                .requestMatchers("/api/pwa/secured/**").authenticated()
                .requestMatchers("/api/pwa/auth/me", "/api/pwa/auth/refresh").authenticated()

                // Catch-up banner poll. Reachable by anyone, but the CONTROLLER still gates the data
                // on NetworkUtils.isInternalRequest and hands off-LAN callers a fixed idle snapshot —
                // the real counters never leave the LAN. Must sit ABOVE the lanOnlyMatcher for
                // "/api/field-sync/" below, since the first matching rule wins.
                //
                // It is permitAll purely to avoid emitting a 401: the banner is mounted at app-root,
                // so every external visitor polled it, and the reverse proxy in front of the hub
                // decorates 401s with WWW-Authenticate (Negotiate/NTLM/Basic), which pops a native
                // Windows credential dialog over our own login page. See FieldSyncController.
                .requestMatchers("/api/field-sync/catchup-status").permitAll()

                // Public endpoints — no auth required
                .requestMatchers(
                    "/api/auth/login", "/api/auth/logout", "/api/auth/me",
                    "/api/auth/forgot-password", "/api/auth/reset-password",
                    "/api/auth/step-up",
                    "/api/pwa/**",
                    "/api/sharepoint-sync/**", "/power-automate/**",
                    "/actuator/health",
                    "/qr/**",
                    "/app/**", "/angular/**",
                    "/", "/home", "/login",
                    "/bootstrap-5.3.3-dist/**", "/functions/**",
                    "/interact.js-main/**", "/my_styles/**",
                    "/background/**", "/uploads/**",
                    "/favicon.ico", "/assets/**",
                    "/ng/config/**",
                    "/ng/agent/status"
                ).permitAll()

                // LAN-only endpoints — only internal IPs can access
                .requestMatchers(lanOnlyMatcher(
                    "/api/sync/", "/api/field-sync/", "/api/resync/",
                    // Contractor directory for desktops — same LAN trust as sync, so a desktop needs
                    // neither an OnLocation key nor a hub account to show it.
                    "/api/contractors/",
                    "/api/files/", "/api/update/", "/api/electron-update/",
                    "/api/resource-packs/", "/api/sync-updates/",
                    "/api/sync-test/", "/api/sync-e2e/", "/api/sync-conformance/",
                    "/api/data-integrity/", "/api/backup/",
                    "/api/attachments/",
                    "/h2-console/",
                    "/work-requests-api/heal-snapshot",
                    // Sync PDFs: any LAN desktop drives the scrape locally and POSTs the
                    // captured PDFs to the hub. Hub-only enforcement is already applied at the
                    // controller (syncConfig.isHubMode() → 403 on non-hub), so a mis-configured
                    // desktop can't act as a rogue writer.
                    "/ng/sds-chemicals/sync-pdfs"
                )).permitAll()

                // Admin-only endpoints — grant approval allowed from the plant network (localhost OR
                // direct-LAN), so an admin at any plant desktop can approve requests on the hub by IP.
                // Not spoofable: NetworkUtils rejects any request carrying reverse-proxy headers, so
                // external traffic (via IIS) can never look "internal".
                .requestMatchers(lanOnlyMatcher("/api/auth/admin/")).hasRole("ADMIN")
                .requestMatchers("/api/auth/admin/**").denyAll() // Block external (reverse-proxied)
                .requestMatchers("/admin/**").hasRole("ADMIN")
                .requestMatchers("/users/**").hasRole("ADMIN")
                .requestMatchers("/ng/users/all-options").authenticated()
                .requestMatchers("/ng/users/**").hasRole("ADMIN")
                .requestMatchers("/ng/chat-audit/**").hasRole("ADMIN")
                // Hub client registry + per-client next-boot directive (list/set/clear) — admin-only, like
                // every other hub-admin NG surface. Without this it would fall through to anyRequest()
                // .authenticated(), letting any signed-in user push a mandatory boot directive to any desktop.
                .requestMatchers("/ng/sync/clients", "/ng/sync/clients/**").hasRole("ADMIN")
                // Sanitized operational diagnostics are available to explicitly delegated support users
                // without requiring the separate full-access grant checked by AccessGrantFilter.
                .requestMatchers("/ng/log-diagnostics/**").hasAnyRole("ADMIN", "LOG_DIAGNOSTICS")
                // Schedule v2 builder — manager/admin authoring of crew patterns, assignments, events.
                .requestMatchers("/ng/admin/schedule-v2/**").hasRole("ADMIN")

                // Schedule sync — writes ShiftDay rows via CRDT (importSchedule). Only the Electron
                // desktop's local scraper (personnel.manager.ts, loopback — mirrors the /ng/rounds/
                // rule below) or an admin should be able to trigger it; any other authenticated
                // principal could otherwise overwrite the roster. Must precede the /ng/schedule/**
                // read rule and the generic catch-all (first match wins).
                .requestMatchers(localhostMatcher("/ng/schedule/sync")).permitAll()
                .requestMatchers("/ng/schedule/sync").hasRole("ADMIN")
                // Schedule reads (roster, coverage-eligibility, freshness, unresolved) — plant staff
                // only, same role set used for Maximo/ical below.
                .requestMatchers("/ng/schedule/**").hasAnyRole("PLANT", "ADMIN")

                // Maximo — open to plant staff (ROLE_PLANT) and admins. Combined with @RestrictedAllowed on
                // the Maximo controllers, a Plant-role user reaches Maximo without needing a FULL access grant
                // (e.g. off-LAN via the hub), while non-Plant users are denied.
                .requestMatchers("/ng/maximo/**").hasAnyRole("PLANT", "ADMIN")

                // Instrument/log deletion is the only destructive operation on the register, and it
                // reaches SharePoint as well as H2 — ADMIN only. Must precede the general rule below.
                .requestMatchers(org.springframework.http.HttpMethod.DELETE,
                        "/ng/instruments/**", "/ng/instrument-logs/**").hasRole("ADMIN")

                // The desktop register screens carry the SAME role as the PWA. Without this they fell
                // through to the blanket `anyRequest().authenticated()`, so any signed-in user —
                // contractor included — could read the whole register and create instruments from the
                // desktop API while being refused the identical operation on their phone.
                .requestMatchers("/ng/instruments/**", "/ng/instrument-logs/**")
                        .hasAnyRole("INSTRUMENTATION", "ADMIN")

                // Field list desktop endpoints — mirror the PWA gate at /api/pwa/field-list-item/**.
                // Rows here route to Maximo as SR/WO and land in SharePoint, so leaving them under
                // the blanket `anyRequest().authenticated()` let any signed-in user — INSULATION
                // contractors included — create/read/delete field lists plant-wide. Contractors have
                // their own scoped surface at /api/pwa/secured/insulation/** for the close-only path.
                .requestMatchers("/ng/field-list-items/**").hasAnyRole("PLANT", "ADMIN")

                // Auth endpoints (must be logged in)
                .requestMatchers("/api/auth/**").authenticated()

                // App shutdown — localhost only, no auth (allows Electron to stop another user's instance)
                // Maximo source toggle — changes how THIS machine behaves, so only this machine's
                // own Electron shell may set it. Not under the /ng/config/** permitAll, which any
                // LAN caller can reach.
                .requestMatchers(localhostMatcher("/ng/settings/")).permitAll()
                .requestMatchers(localhostMatcher("/server/stop")).permitAll()

                // Rounds report ingest — the desktop WebView AMS scraper POSTs
                // snapshots from the same machine (no session cookie available)
                .requestMatchers(localhostMatcher("/ng/rounds/")).permitAll()

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
            .addFilterBefore(aiDiagnosticsApiKeyFilter, UsernamePasswordAuthenticationFilter.class)
            // StepUpAuthFilter must run AFTER the session-establishing filters so the
            // original SecurityContext (user A) is in place; it swaps to user B for
            // one request and restores in a finally block.
            .addFilterAfter(stepUpAuthFilter, UsernamePasswordAuthenticationFilter.class)
            .addFilterAfter(accessGrantFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
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
            "X-Machine-Id", "X-Machine-Name", "X-Device-Number", "X-Request-Id",
            // ClientIdInterceptor stamps this on every non-GET Angular write
            // so the tab can filter its own SSE echoes. Same-origin today, but
            // omitting it here would silently fail preflight the moment the
            // frontend is served from a different origin than the API.
            "X-Client-Id"
        ));
        configuration.setExposedHeaders(Arrays.asList("x-auth-token", "X-Request-Id"));
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
