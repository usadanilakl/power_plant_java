package com.dk_power.power_plant_java.controller.automation;

import com.dk_power.power_plant_java.sevice.automation.RedTagAutomationService;
import com.dk_power.power_plant_java.dto.permits.LotoPointDto;
import org.sikuli.script.FindFailed;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;

import java.io.IOException;

@Controller
@RequestMapping("/red-tag-automation")
public class RedTagAutomationController {

    private final RedTagAutomationService redTagAutomationService;

    @Autowired
    public RedTagAutomationController(RedTagAutomationService redTagAutomationService) {
        this.redTagAutomationService = redTagAutomationService;
    }

    @GetMapping
    public String showAutomationPage(Model model) {
        model.addAttribute("lotoPoint", new LotoPointDto());
        return "loto/red-tag-automation";
    }

    @PostMapping("/open-app")
    public String openApp(Model model) {
        try {
            redTagAutomationService.openApp();
            model.addAttribute("message", "Application opened successfully");
        } catch (IOException | InterruptedException | FindFailed e) {
            model.addAttribute("error", "Error opening application: " + e.getMessage());
        }
        return "loto/red-tag-automation";
    }

    @PostMapping("/add-device")
    public String addDevice(LotoPointDto lotoPoint, Model model) {
        try {
            redTagAutomationService.addNewDevice(lotoPoint);
            model.addAttribute("message", "Device added successfully");
        } catch (FindFailed e) {
            model.addAttribute("error", "Error adding device: " + e.getMessage());
        }
        return "loto/red-tag-automation";
    }
}