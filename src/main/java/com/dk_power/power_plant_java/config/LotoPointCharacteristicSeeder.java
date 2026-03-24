package com.dk_power.power_plant_java.config;

import com.dk_power.power_plant_java.sevice.angular.NgValueService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class LotoPointCharacteristicSeeder {

    private static final String CATEGORY_NAME = "Equipment Characteristic";

    private static final List<String> DEFAULT_CHARACTERISTICS = List.of(
            "Fluid",
            "Voltage",
            "Pressure",
            "Temperature",
            "Line Size",
            "Pipe Spec",
            "System",
            "Horsepower",
            "Rotation",
            "Normal Position",
            "Failed Position",
            "Isolation Boundary",
            "Heat Tracing",
            "Insulation",
            "Equipment Type",
            "Remarks"
    );

    private final NgValueService valueService;
    private final SyncConfig syncConfig;

    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void seedCharacteristics() {
        if (!syncConfig.isHubMode()) {
            log.info("LOTO point characteristic seeder skipped (not hub mode)");
            return;
        }

        try {
            valueService.createCategory(CATEGORY_NAME);
            DEFAULT_CHARACTERISTICS.forEach(name -> valueService.createValue(CATEGORY_NAME, name));
            log.info("LOTO point characteristic seeder completed with {} default values", DEFAULT_CHARACTERISTICS.size());
        } catch (Exception e) {
            log.error("LOTO point characteristic seeder failed (non-fatal): {}", e.getMessage(), e);
        }
    }
}
