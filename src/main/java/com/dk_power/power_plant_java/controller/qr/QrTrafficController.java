package com.dk_power.power_plant_java.controller.qr;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@Controller
public class QrTrafficController {

    @GetMapping("/qr/{tagNumber}")
    public String redirectToAngularQr(@PathVariable String tagNumber) {
        return "redirect:/app/qr/equipment/" + tagNumber;
    }
}
