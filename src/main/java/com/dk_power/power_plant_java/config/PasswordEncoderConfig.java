package com.dk_power.power_plant_java.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * The {@link PasswordEncoder} bean lives here (not on {@code SecurityConfigSpring}) so that beans
 * required to build the security filter chain — e.g. {@code SyncAtLoginService} via
 * {@code PwaJwtAuthFilter} — can depend on the encoder without creating a construction cycle with
 * the config class that also wires the filters.
 */
@Configuration
public class PasswordEncoderConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
