package com.dk_power.power_plant_java.controller;

import com.dk_power.power_plant_java.enums.SortingGroup;
import com.dk_power.power_plant_java.sevice.plant.impl.FileServiceImpl;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
@Controller
@AllArgsConstructor
public class HomeController {
    private final FileServiceImpl fileService;

    @GetMapping("/")
    String getHome(Model model){
        model.addAttribute("files", fileService.getAll());
        model.addAttribute("sortingGroups", SortingGroup.values());
        return "layouts/main-template";
    }
    @GetMapping("/admin")
    String getAdmin(){
        return "admin/admin";
    }

    @GetMapping("/loto")
    String getLoto(){
        return "new-loto-form";
    }

    @GetMapping("/dev")
    String getDev(){
        return "admin/dev";
    }

}
