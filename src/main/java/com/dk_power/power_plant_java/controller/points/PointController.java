package com.dk_power.power_plant_java.controller.points;

import com.dk_power.power_plant_java.dto.equipment.EquipmentDto;
import com.dk_power.power_plant_java.entities.data_transfer.RevisedLotoPoints;
import com.dk_power.power_plant_java.entities.loto.LotoPoint;
import com.dk_power.power_plant_java.sevice.categories.CategoryService;
import com.dk_power.power_plant_java.sevice.data_transfer.excel.RevisedLotoPointService;
import com.dk_power.power_plant_java.sevice.equipment.EquipmentService;
import com.dk_power.power_plant_java.sevice.equipment.LotoPointService;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Controller
@RequestMapping("/point")
@AllArgsConstructor
public class PointController {
    private final CategoryService categoryService;
    private final EquipmentService equipmentService;
    private final LotoPointService lotoPointService;
    private final RevisedLotoPointService revisedLotoPointService;

    @GetMapping("/get-info-form/{id}")
    public String getInfoForm(Model model, @PathVariable("id") String id){
        model.addAttribute("vendors",categoryService.getVendors());
        model.addAttribute("systems",categoryService.getVendors());
        model.addAttribute("locations",categoryService.getLocations());
        model.addAttribute("eqTypes",categoryService.getEqTypes());
        model.addAttribute("point",equipmentService.getDtoById(id));
        return "/partials/point-info-form";
    }

    @GetMapping("/get-html-info-form/{id}")
    public String getHtmlInfoForm(@PathVariable("id") String id){
        return "/points/html-point-form";
    }

    @GetMapping("/{type}")
    public String showAllPoints(@PathVariable("type") String type, Model model){
        model.addAttribute("type",type);
        return "/points/show-all-points";
    }

    @PostMapping("/update")
    public String updatePoint(@ModelAttribute("point") EquipmentDto point){
        System.out.println(point);
        equipmentService.save(point);
        return "redirect:/test/";
    }


    @GetMapping("/get-revised-excel-points")
    public ResponseEntity<List<RevisedLotoPoints>> getAllRivisedPoint(){
        return ResponseEntity.ok(revisedLotoPointService.getAll());
    }
}