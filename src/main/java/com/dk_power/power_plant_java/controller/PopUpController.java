package com.dk_power.power_plant_java.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/popup")
public class PopUpController {
    @GetMapping("/get")
    public String getPopUp(){
        return "partials/popup";
    }
}