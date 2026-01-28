package com.dk_power.power_plant_java.sevice;

import com.dk_power.power_plant_java.entities.categories.Category;
import com.dk_power.power_plant_java.entities.categories.Value;
import com.dk_power.power_plant_java.entities.equipment.Equipment;
import com.dk_power.power_plant_java.entities.files.FileObject;
import com.dk_power.power_plant_java.entities.loto.LotoPoint;
import com.dk_power.power_plant_java.entities.loto.LotoStandard;
import com.dk_power.power_plant_java.entities.loto.ZeroEnergy;
import com.dk_power.power_plant_java.sevice.angular.loto.NgLotoStandardService;
import com.dk_power.power_plant_java.sevice.base_services.SyncableService;
import com.dk_power.power_plant_java.sevice.categories.CategoryService;
import com.dk_power.power_plant_java.sevice.categories.ValueService;
import com.dk_power.power_plant_java.sevice.equipment.EquipmentService;
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
            @Lazy EquipmentService equipmentService,
            @Lazy LotoPointService lotoPointService,
            @Lazy CategoryService categoryService,
            @Lazy ValueService valueService,
            @Lazy FileService fileService,
            @Lazy ZeroEnergyService zeroEnergyService,
            @Lazy NgLotoStandardService ngLotoStandardService
    ) {
        serviceMap.put(Equipment.class.getSimpleName(), equipmentService);
        serviceMap.put(LotoPoint.class.getSimpleName(), lotoPointService);
        serviceMap.put(Category.class.getSimpleName(), categoryService);
        serviceMap.put(Value.class.getSimpleName(), valueService);
        serviceMap.put(FileObject.class.getSimpleName(), fileService);
        serviceMap.put(ZeroEnergy.class.getSimpleName(), zeroEnergyService);
        serviceMap.put(LotoStandard.class.getSimpleName(), ngLotoStandardService);
    }

    public SyncableService getService(String entityClass) {
        return serviceMap.get(entityClass);
    }
}
