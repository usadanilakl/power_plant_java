package com.dk_power.power_plant_java.controller.plant;

import com.dk_power.power_plant_java.dto.plant.PointDto;
import com.dk_power.power_plant_java.entities.plant.EquipmentType;
import com.dk_power.power_plant_java.entities.plant.Location;
import com.dk_power.power_plant_java.entities.plant.Syst;
import com.dk_power.power_plant_java.entities.plant.Vendor;
import com.dk_power.power_plant_java.sevice.plant.impl.*;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Controller
@RequestMapping("/point")
public class PointController {
    private final PointServiceImpl pointService;
    private final VendorServiceImpl vendorService;
    private final SystemServiceImpl systemService;
    private final EquipmentTypeServiceImpl equipmentTypeService;
    private final LocationServiceImpl locationService;

    public PointController(PointServiceImpl pointService, VendorServiceImpl vendorService, SystemServiceImpl systemService, EquipmentTypeServiceImpl equipmentTypeService, LocationServiceImpl locationService) {
        this.pointService = pointService;
        this.vendorService = vendorService;
        this.systemService = systemService;
        this.equipmentTypeService = equipmentTypeService;
        this.locationService = locationService;
    }

    @GetMapping("/get-info-form/{id}")
    public String getInfoForm(Model model, @PathVariable("id") String id){
        model.addAttribute("vendors",vendorService.getAll());
        model.addAttribute("systems",systemService.getAll());
        model.addAttribute("locations",locationService.getAll());
        model.addAttribute("eqTypes",equipmentTypeService.getAll());
        model.addAttribute("point",pointService.getPointDtoById(Long.parseLong(id)));
        return "/partials/point-info-form";
    }

    @PostMapping("/update")
    public void updatePoint(@ModelAttribute("point") PointDto point){
        pointService.updatePoint(point);
    }

}
