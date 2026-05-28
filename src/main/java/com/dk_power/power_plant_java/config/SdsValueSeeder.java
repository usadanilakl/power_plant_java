package com.dk_power.power_plant_java.config;

import com.dk_power.power_plant_java.sevice.angular.NgValueService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "sync.role", havingValue = "hub")
@RequiredArgsConstructor
@Slf4j
@Order(101)
public class SdsValueSeeder implements ApplicationRunner {

    private final NgValueService valueService;

    @Override
    public void run(ApplicationArguments args) {
        try {
            valueService.createValue("SdsStatus", "Incoming");
            valueService.createValue("SdsStatus", "Pending");
            valueService.createValue("SdsStatus", "Filed");
            valueService.createValue("SdsStatus", "Removed");
            log.info("[SdsValueSeeder] SDS categories seeded successfully");
        } catch (Exception e) {
            log.warn("[SdsValueSeeder] Failed to seed SDS values: {}", e.getMessage());
        }
    }
}
