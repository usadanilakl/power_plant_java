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
public class InventoryValueSeeder implements ApplicationRunner {

    private final NgValueService valueService;

    @Override
    public void run(ApplicationArguments args) {
        try {
            // Seed InventoryType category
            valueService.createValue("InventoryType", "Tools");
            valueService.createValue("InventoryType", "Safety Equipment");
            valueService.createValue("InventoryType", "Spare Parts");
            valueService.createValue("InventoryType", "Test Equipment");

            // Seed InventoryStatus category
            valueService.createValue("InventoryStatus", "Available");
            valueService.createValue("InventoryStatus", "Checked Out");
            valueService.createValue("InventoryStatus", "Missing");
            valueService.createValue("InventoryStatus", "Retired");

            log.info("[InventoryValueSeeder] Inventory categories seeded successfully");
        } catch (Exception e) {
            log.warn("[InventoryValueSeeder] Failed to seed inventory values: {}", e.getMessage());
        }
    }
}
