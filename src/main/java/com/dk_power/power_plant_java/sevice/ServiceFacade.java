package com.dk_power.power_plant_java.sevice;

import com.dk_power.power_plant_java.entities.categories.Category;
import com.dk_power.power_plant_java.entities.categories.Value;
import com.dk_power.power_plant_java.entities.equipment.*;
import com.dk_power.power_plant_java.entities.esp.EspDevice;
import com.dk_power.power_plant_java.entities.esp.LedStrip;
import com.dk_power.power_plant_java.entities.files.FileObject;
import com.dk_power.power_plant_java.entities.loto.*;
import com.dk_power.power_plant_java.entities.permits.*;
import com.dk_power.power_plant_java.entities.users.User;
import com.dk_power.power_plant_java.sevice.angular.NgCategoryService;
import com.dk_power.power_plant_java.sevice.angular.NgEquipmentService;
import com.dk_power.power_plant_java.sevice.angular.NgUserService;
import com.dk_power.power_plant_java.sevice.angular.NgValueService;
import com.dk_power.power_plant_java.sevice.angular.base.NgCrudService;
import com.dk_power.power_plant_java.sevice.angular.equipment.*;
import com.dk_power.power_plant_java.sevice.angular.esp.NgEspDeviceService;
import com.dk_power.power_plant_java.sevice.angular.esp.NgLedStripService;
import com.dk_power.power_plant_java.sevice.angular.file.NgFileService;
import com.dk_power.power_plant_java.sevice.angular.loto.*;
import com.dk_power.power_plant_java.sevice.angular.permits.*;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

/**
 * Service facade that provides access to all NgCrudService implementations.
 * Used by FieldSyncService for entity synchronization.
 */
@Service
public class ServiceFacade {

    private final Map<String, NgCrudService<?, ?, ?, ?>> serviceMap = new HashMap<>();

    public ServiceFacade(
            // Categories
            @Lazy NgCategoryService categoryService,
            @Lazy NgValueService valueService,
            // Users
            @Lazy NgUserService userService,
            // Files
            @Lazy NgFileService fileService,
            // Equipment
            @Lazy NgEquipmentService equipmentService,
            @Lazy NgHeatTraceService heatTraceService,
            @Lazy NgHighlightService highlightService,
            @Lazy NgElectricalPanelService electricalPanelService,
            @Lazy NgEqBreakerService eqBreakerService,
            @Lazy NgHtPanelService htPanelService,
            @Lazy NgHtBreakerService htBreakerService,
            // LOTO
            @Lazy NgLotoPointService lotoPointService,
            @Lazy NgLotoService lotoService,
            @Lazy NgLotoStandardService lotoStandardService,
            @Lazy NgLotoSnapshotService lotoSnapshotService,
            @Lazy NgLotoBoxService lotoBoxService,
            @Lazy NgLockService lockService,
            @Lazy NgZeroEnergyService zeroEnergyService,
            // ESP
            @Lazy NgEspDeviceService espDeviceService,
            @Lazy NgLedStripService ledStripService,
            // Permits
            @Lazy NgSafeWorkService safeWorkService,
            @Lazy NgHotWorkService hotWorkService,
            @Lazy NgConfinedSpaceService confinedSpaceService,
            @Lazy NgWorkRequestService workRequestService,
            @Lazy NgDailyPermitPackageService dailyPermitPackageService
    ) {
        // Categories
        serviceMap.put(Category.class.getSimpleName(), categoryService);
        serviceMap.put(Value.class.getSimpleName(), valueService);
        // Users
        serviceMap.put(User.class.getSimpleName(), userService);
        // Files
        serviceMap.put(FileObject.class.getSimpleName(), fileService);
        // Equipment
        serviceMap.put(Equipment.class.getSimpleName(), equipmentService);
        serviceMap.put(HeatTrace.class.getSimpleName(), heatTraceService);
        serviceMap.put(Highlight.class.getSimpleName(), highlightService);
        serviceMap.put(ElectricalPanel.class.getSimpleName(), electricalPanelService);
        serviceMap.put(EqBreaker.class.getSimpleName(), eqBreakerService);
        serviceMap.put(HtPanel.class.getSimpleName(), htPanelService);
        serviceMap.put(HtBreaker.class.getSimpleName(), htBreakerService);
        // LOTO
        serviceMap.put(LotoPoint.class.getSimpleName(), lotoPointService);
        serviceMap.put(Loto.class.getSimpleName(), lotoService);
        serviceMap.put(LotoStandard.class.getSimpleName(), lotoStandardService);
        serviceMap.put(LotoSnapshot.class.getSimpleName(), lotoSnapshotService);
        serviceMap.put(LotoBox.class.getSimpleName(), lotoBoxService);
        serviceMap.put(Lock.class.getSimpleName(), lockService);
        serviceMap.put(ZeroEnergy.class.getSimpleName(), zeroEnergyService);
        // ESP
        serviceMap.put(EspDevice.class.getSimpleName(), espDeviceService);
        serviceMap.put(LedStrip.class.getSimpleName(), ledStripService);
        // Permits
        serviceMap.put(SafeWork.class.getSimpleName(), safeWorkService);
        serviceMap.put(HotWork.class.getSimpleName(), hotWorkService);
        serviceMap.put(ConfinedSpace.class.getSimpleName(), confinedSpaceService);
        serviceMap.put(WorkRequest.class.getSimpleName(), workRequestService);
        serviceMap.put(DailyPermitPackage.class.getSimpleName(), dailyPermitPackageService);
    }

    /**
     * Get the NgCrudService for the given entity type.
     *
     * @param entityClass The simple name of the entity class (e.g., "LotoStandard")
     * @return The NgCrudService for that entity, or null if not found
     */
    public NgCrudService<?, ?, ?, ?> getService(String entityClass) {
        return serviceMap.get(entityClass);
    }
}
