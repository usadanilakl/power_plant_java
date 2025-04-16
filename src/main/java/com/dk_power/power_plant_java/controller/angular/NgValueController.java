package com.dk_power.power_plant_java.controller.angular;

import com.dk_power.power_plant_java.sevice.angular.NgValueService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/ng/values")
@RequiredArgsConstructor
public class NgValueController {
    private final NgValueService ngValueService;

    @GetMapping("/of-category")
    public String getNgValues() {
        return ngValueService.getValuesOfCategory();
    }
}
