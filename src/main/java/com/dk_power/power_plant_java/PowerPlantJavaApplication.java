package com.dk_power.power_plant_java;



import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Stream;

@SpringBootApplication
@RequiredArgsConstructor
@EnableJpaRepositories(basePackages = "com.dk_power.power_plant_java.repository")
@EntityScan(basePackages = "com.dk_power.power_plant_java.entities")
public class PowerPlantJavaApplication implements CommandLineRunner {



    public static void main(String[] args) {
//        SpringApplication.run(PowerPlantJavaApplication.class, args);

        SpringApplicationBuilder builder = new SpringApplicationBuilder(PowerPlantJavaApplication.class);
        builder.headless(false);
        builder.run(args);
    }


    @Override
    @Transactional
    public void run(String... args) throws Exception {

        System.err.println("=====================================================");
        System.out.println("App is Ready: open browser and type: http://localhost:8082");


    }
}
