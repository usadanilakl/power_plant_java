package com.dk_power.power_plant_java.sevice;

import com.dk_power.power_plant_java.entities.categories.Category;
import com.dk_power.power_plant_java.entities.categories.Value;
import com.dk_power.power_plant_java.entities.equipment.*;
import com.dk_power.power_plant_java.entities.files.FileObject;
import com.dk_power.power_plant_java.entities.loto.*;
import com.dk_power.power_plant_java.entities.permits.*;
import com.dk_power.power_plant_java.entities.users.User;
import com.dk_power.power_plant_java.sevice.angular.NgUserService;
import com.dk_power.power_plant_java.sevice.angular.loto.*;
import com.dk_power.power_plant_java.sevice.angular.permits.*;
import com.dk_power.power_plant_java.sevice.base_services.SyncableService;
import com.dk_power.power_plant_java.sevice.categories.CategoryService;
import com.dk_power.power_plant_java.sevice.categories.ValueService;
import com.dk_power.power_plant_java.sevice.equipment.*;
import com.dk_power.power_plant_java.sevice.file.FileService;
import com.dk_power.power_plant_java.sevice.loto.loto_point.LotoPointService;
import com.dk_power.power_plant_java.sevice.loto.zero_energy.ZeroEnergyService;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
@SuppressWarnings("rawtypes")
public class ServiceFacade {

    private final Map<String, SyncableService> serviceMap = new HashMap<>();

    public ServiceFacade(
            // Categories
            @Lazy CategoryService categoryService,
            @Lazy ValueService valueService,
            // Files
            @Lazy FileService fileService,
            // Equipment
            @Lazy EquipmentService equipmentService,
            @Lazy HeatTraceService heatTraceService,
            @Lazy HighlightService highlightService,
            @Lazy ElectricalPanelService electricalPanelService,
            @Lazy EqBreakerService eqBreakerService,
            @Lazy HtPanelService htPanelService,
            @Lazy HtBreakerService htBreakerService,
            // LOTO
            @Lazy LotoPointService lotoPointService,
            @Lazy NgLotoService ngLotoService,
            @Lazy NgLotoStandardService ngLotoStandardService,
            @Lazy NgLotoBoxService ngLotoBoxService,
            @Lazy NgLockService ngLockService,
            @Lazy ZeroEnergyService zeroEnergyService,
            // Users
            @Lazy NgUserService ngUserService,
            // Permits
            @Lazy NgSafeWorkService ngSafeWorkService,
            @Lazy NgHotWorkService ngHotWorkService,
            @Lazy NgConfinedSpaceService ngConfinedSpaceService,
            @Lazy NgWorkRequestService ngWorkRequestService,
            @Lazy NgDailyPermitPackageService ngDailyPermitPackageService
    ) {
        // Categories
        serviceMap.put(Category.class.getSimpleName(), categoryService);
        serviceMap.put(Value.class.getSimpleName(), valueService);
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
        serviceMap.put(Loto.class.getSimpleName(), ngLotoService);
        serviceMap.put(LotoStandard.class.getSimpleName(), ngLotoStandardService);
        serviceMap.put(LotoBox.class.getSimpleName(), ngLotoBoxService);
        serviceMap.put(Lock.class.getSimpleName(), ngLockService);
        serviceMap.put(ZeroEnergy.class.getSimpleName(), zeroEnergyService);
        // Users
        serviceMap.put(User.class.getSimpleName(), ngUserService);
        // Permits
        serviceMap.put(SafeWork.class.getSimpleName(), ngSafeWorkService);
        serviceMap.put(HotWork.class.getSimpleName(), ngHotWorkService);
        serviceMap.put(ConfinedSpace.class.getSimpleName(), ngConfinedSpaceService);
        serviceMap.put(WorkRequest.class.getSimpleName(), ngWorkRequestService);
        serviceMap.put(DailyPermitPackage.class.getSimpleName(), ngDailyPermitPackageService);
    }

    public SyncableService getService(String entityClass) {
        return serviceMap.get(entityClass);
    }
}
