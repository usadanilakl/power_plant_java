package com.dk_power.power_plant_java.controller.plant;

import com.dk_power.power_plant_java.entities.plant.EquipmentType;
import com.dk_power.power_plant_java.entities.plant.files.FileType;
import com.dk_power.power_plant_java.entities.plant.Syst;
import com.dk_power.power_plant_java.entities.plant.Vendor;
import com.dk_power.power_plant_java.sevice.plant.impl.EquipmentTypeServiceImpl;
import com.dk_power.power_plant_java.sevice.plant.impl.FileTypeServiceImpl;
import com.dk_power.power_plant_java.sevice.plant.impl.SystemServiceImpl;
import com.dk_power.power_plant_java.sevice.plant.impl.VendorServiceImpl;
import jakarta.transaction.Transactional;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;

@AllArgsConstructor
@Controller
@RequestMapping("/group")
@Transactional
public class GroupController {
    private final SystemServiceImpl groupServiceSystem;
    private final EquipmentTypeServiceImpl groupServiceEquipmentType;
    private final FileTypeServiceImpl fileTypeGroupService;
    private final VendorServiceImpl vendorGroupService;
    @PostMapping("/create")
    public String createNewItem(@RequestParam(name="group") String group, @RequestParam(name="value") String value){
        switch (group) {
            case "system" -> groupServiceSystem.createNew(value, Syst.class);
            case "equipmenttype" -> groupServiceEquipmentType.createNew(value, EquipmentType.class);
            case "filetype" -> fileTypeGroupService.createNew(value, FileType.class);
            case "vendor" -> vendorGroupService.createNew(value, Vendor.class);
        }
        return "redirect:/lotos/create";
    }
}
