package com.dk_power.power_plant_java.controller.plant;

import com.dk_power.power_plant_java.dto.categories.CategoryDto;
import com.dk_power.power_plant_java.entities.categories.Category;
import com.dk_power.power_plant_java.sevice.categories.CategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

import java.util.List;

@Controller
@RequiredArgsConstructor
@RequestMapping("/cat")
public class CategoryController {
    private final CategoryService categoryService;
    @GetMapping("/popup")
    public String getCatPopup(){
        return "/category/category-popup";
    }

}
