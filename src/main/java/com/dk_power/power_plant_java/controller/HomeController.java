package com.dk_power.power_plant_java.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
@Controller
public class HomeController {
    @GetMapping("/")
    String getHome(){
        return "partials/main-template";
    }
    @GetMapping("/admin")
    String getAdmin(){
        return "admin/admin";
    }

    @GetMapping("/loto")
    String getLoto(){
        return "partials/main-template";
    }

    @GetMapping("/dev")
    String getDev(){
        return "admin/dev";
    }
}
