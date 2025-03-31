package com.dk_power.power_plant_java.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;

@Configuration
public class HibernateConfig {

    @Bean
    public DevicePrefixedIdGenerator devicePrefixedIdGenerator(Environment env) {
        return new DevicePrefixedIdGenerator();
    }
}