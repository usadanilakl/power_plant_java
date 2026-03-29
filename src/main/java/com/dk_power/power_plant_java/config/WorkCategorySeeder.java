package com.dk_power.power_plant_java.config;

import com.dk_power.power_plant_java.entities.categories.Value;
import com.dk_power.power_plant_java.entities.permits.WorkCategoryProfile;
import com.dk_power.power_plant_java.repository.permits.WorkCategoryProfileRepo;
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
public class WorkCategorySeeder {

    private static final String CATEGORY_NAME = "Work Category";

    private static final List<String> DEFAULT_WORK_CATEGORIES = List.of(
            "Scaffolding",
            "Insulation",
            "Inspection",
            "Mechanical",
            "Electrical",
            "Energized",
            "I&C",
            "Rigging",
            "Cleaning",
            "Civil",
            "Operations",
            "Welding / Hot Work"
    );

    private final NgValueService valueService;
    private final SyncConfig syncConfig;
    private final WorkCategoryProfileRepo profileRepo;

    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void seedWorkCategories() {
        if (!syncConfig.isHubMode()) {
            log.info("Work category seeder skipped (not hub mode)");
            return;
        }

        try {
            valueService.createCategory(CATEGORY_NAME);
            DEFAULT_WORK_CATEGORIES.forEach(category -> {
                Value value = valueService.createValue(CATEGORY_NAME, category);
                ensureProfileExists(value);
            });
            log.info("Work category seeder completed with {} default values and profiles", DEFAULT_WORK_CATEGORIES.size());
        } catch (Exception e) {
            log.error("Work category seeder failed (non-fatal): {}", e.getMessage(), e);
        }
    }

    private void ensureProfileExists(Value workCategory) {
        if (workCategory == null || workCategory.getId() == null) return;
        profileRepo.findByWorkCategory_Id(workCategory.getId()).orElseGet(() -> {
            WorkCategoryProfile profile = new WorkCategoryProfile();
            profile.setWorkCategory(workCategory);
            profile.setName(workCategory.getName());
            return profileRepo.save(profile);
        });
    }
}
