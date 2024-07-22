package com.dk_power.power_plant_java.controller.category;

import com.dk_power.power_plant_java.sevice.categories.CategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequiredArgsConstructor
@RequestMapping("/cat")
public class CategoryController {
    private final CategoryService categoryService;
    @GetMapping("/popup")
    public String getCatPopup(){
        return "/category/category-popup";
    }
    @GetMapping("/refractor-popup")
    public String getCatRefractorPopup(){
        return "/category/value-refractor-popup";
    }

}
