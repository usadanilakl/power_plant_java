package com.dk_power.power_plant_java.controller.plant;

import com.dk_power.power_plant_java.entities.plant.EquipmentType;
import com.dk_power.power_plant_java.entities.plant.FileType;
import com.dk_power.power_plant_java.entities.plant.Syst;
import com.dk_power.power_plant_java.sevice.plant.GroupService;
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
    private final GroupService<Syst> groupServiceSystem;
    private final GroupService<EquipmentType> groupServiceEquipmentType;
    private final GroupService<FileType> fileTypeGroupService;
    @PostMapping("/create")
    public String createNewItem(@RequestParam(name="group") String group, @RequestParam(name="value") String value){
        switch (group) {
            case "system" -> groupServiceSystem.createNew(value, Syst.class);
            case "equipmenttype" -> groupServiceEquipmentType.createNew(value, EquipmentType.class);
            case "filetype" -> fileTypeGroupService.createNew(value, FileType.class);
        }
        return "redirect:/lotos/create";
    }
}
