package com.dk_power.power_plant_java.sevice;

import com.dk_power.power_plant_java.entities.base_entities.BaseIdEntity;
import com.dk_power.power_plant_java.entities.categories.Category;
import com.dk_power.power_plant_java.entities.categories.Value;
import com.dk_power.power_plant_java.entities.equipment.Equipment;
import com.dk_power.power_plant_java.entities.files.FileObject;
import com.dk_power.power_plant_java.entities.loto.LotoPoint;
import com.dk_power.power_plant_java.sevice.base_services.CrudService;
import com.dk_power.power_plant_java.sevice.categories.CategoryService;
import com.dk_power.power_plant_java.sevice.categories.ValueService;
import com.dk_power.power_plant_java.sevice.equipment.EquipmentService;
import com.dk_power.power_plant_java.sevice.file.FileService;
import com.dk_power.power_plant_java.sevice.loto.loto_point.LotoPointService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@Service
public class ServiceFacade {

    private final Map<String, CrudService<?, ?, ?, ?>> serviceMap = new HashMap<>();

    public ServiceFacade(
            @Lazy EquipmentService equipmentService,
            @Lazy LotoPointService lotoPointService,
            @Lazy CategoryService categoryService,
            @Lazy ValueService valueService,
            @Lazy FileService fileService
    ) {

        serviceMap.put(Equipment.class.getSimpleName(), equipmentService);
        serviceMap.put(LotoPoint.class.getSimpleName(), lotoPointService);
        serviceMap.put(Category.class.getSimpleName(), categoryService);
        serviceMap.put(Value.class.getSimpleName(), valueService);
        serviceMap.put(FileObject.class.getSimpleName(), fileService);
    }

    public <T extends BaseIdEntity> CrudService<?,?,?,?> getService(String entityClass) {
        return serviceMap.get(entityClass);
    }
}
