package com.dk_power.power_plant_java.controller;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/print")
public class BradyController {

    @GetMapping("/tag/{tag}/{description}")
    public String bradyIndex(Model model, @PathVariable String tag, @PathVariable String description) {
        // Add any data you want to pass to the view
        model.addAttribute("tag", tag);
        model.addAttribute("description", description);

        return "forward:/brady/index.html";
    }
}