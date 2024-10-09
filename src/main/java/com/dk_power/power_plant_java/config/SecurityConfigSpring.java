package com.dk_power.power_plant_java.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.password.NoOpPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;


@Configuration
@EnableWebSecurity
public class SecurityConfigSpring {
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .authorizeHttpRequests((requests) -> requests
                        .requestMatchers(
                                "/",
                                "/home",
                                "/bootstrap-5.3.3-dist/**",
                                "/functions/**",
                                "/interact.js-main/**",
                                "/my_styles/**",
                                "/uploads**",
                                "/h2-console/**",
                                "/background/**"
                        ).permitAll()
                        //.requestMatchers("/**").hasRole("Admin")
                        .anyRequest().authenticated()

                )
                .csrf(csrf->csrf.ignoringRequestMatchers("/h2-console/**"))
                .headers(headers->headers.frameOptions(frame->frame.sameOrigin()))
                .formLogin((form) -> form
                        .loginPage("/login")
                        .defaultSuccessUrl("/")
                        .permitAll()
                )
                .logout((logout) -> logout.permitAll());

        return http.build();




    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return NoOpPasswordEncoder.getInstance();
    }


}