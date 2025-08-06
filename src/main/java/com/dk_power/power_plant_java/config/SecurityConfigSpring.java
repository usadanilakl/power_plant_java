package com.dk_power.power_plant_java.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.password.NoOpPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;


@Configuration
@EnableWebSecurity
public class SecurityConfigSpring {
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .authorizeHttpRequests((requests) -> requests
                        .anyRequest().permitAll()
                )
                .csrf(csrf->csrf.ignoringRequestMatchers("/h2-console/**", "/images-api/**", "/ng/**","server/**","api/backup/**","/browser/**","/print/**", "/api-lotos/**"))
                .headers(headers -> headers.frameOptions(frame -> frame.disable()));

        return http.build();
    }
//    @Bean
//    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
//        http
//                .authorizeHttpRequests((requests) -> requests
//                        .requestMatchers(
//                                "/",
//                                "/home",
//                                "/bootstrap-5.3.3-dist/**",
//                                "/functions/**",
//                                "/interact.js-main/**",
//                                "/my_styles/**",
//                                "/uploads**",
//                                "/h2-console/**",
//                                "/background/**",
//                                "/angular/**", "/app/**"
//                        ).permitAll()
//                        //.requestMatchers("/**").hasRole("Admin")
//                        .anyRequest().authenticated()
//
//                )
//                .csrf(csrf->csrf.ignoringRequestMatchers("/h2-console/**"))
//                .headers(headers->headers.frameOptions(frame->frame.sameOrigin()))
//                .formLogin((form) -> form
//                        .loginPage("/login")
//                        .defaultSuccessUrl("/")
//                        .permitAll()
//                )
//                .logout((logout) -> logout.permitAll());
//
//        return http.build();
//
//
//
//
//    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return NoOpPasswordEncoder.getInstance();
    }


    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(Arrays.asList("http://localhost:4200", "http://localhost", "null"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("authorization", "content-type", "x-auth-token"));
        configuration.setExposedHeaders(Arrays.asList("x-auth-token"));
        configuration.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

//    @Bean
//    public CorsConfigurationSource corsConfigurationSource() {
//        return request -> {
//            CorsConfiguration config = new CorsConfiguration();
//            String origin = request.getHeader("Origin");
//            if (origin == null || "null".equals(origin)) {
//                // Allow 'null' origin requests (from file://)
//                config.addAllowedOriginPattern("*");
//            } else {
//                config.setAllowedOrigins(Arrays.asList("http://localhost:4200", "http://localhost"));
//            }
//            config.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
//            config.setAllowedHeaders(Arrays.asList("authorization", "content-type", "x-auth-token"));
//            config.setExposedHeaders(Arrays.asList("x-auth-token"));
//            config.setAllowCredentials(true);
//            return config;
//        };
//    }



}