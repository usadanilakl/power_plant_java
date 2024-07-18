package com.dk_power.power_plant_java.controller.plant;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequiredArgsConstructor
@RequestMapping("/cat")
public class CategoryController {
    @GetMapping("/popup")
    public String getCatPopup(){
        return "/category/category-popup";
    }
}
