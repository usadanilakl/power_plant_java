package com.dk_power.power_plant_java.config;

import com.dk_power.power_plant_java.sevice.angular.NgValueService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
@Order(100)
public class FieldListValueSeeder implements ApplicationRunner {

    private final NgValueService valueService;

    @Override
    public void run(ApplicationArguments args) {
        try {
            // Seed FieldListType category
            valueService.createValue("FieldListType", "Insulation Removal");
            valueService.createValue("FieldListType", "Leaks");
            valueService.createValue("FieldListType", "Winterization");

            // Seed FieldListStatus category
            valueService.createValue("FieldListStatus", "Open");
            valueService.createValue("FieldListStatus", "In Progress");
            valueService.createValue("FieldListStatus", "Resolved");
            valueService.createValue("FieldListStatus", "Closed");

            log.info("[FieldListValueSeeder] Field list categories seeded successfully");
        } catch (Exception e) {
            log.warn("[FieldListValueSeeder] Failed to seed field list values: {}", e.getMessage());
        }
    }
}
