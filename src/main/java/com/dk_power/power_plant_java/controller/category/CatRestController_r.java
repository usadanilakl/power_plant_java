package com.dk_power.power_plant_java.controller.category;

import com.dk_power.power_plant_java.dto.categories.CategoryDto;
import com.dk_power.power_plant_java.entities.categories.Category;
import com.dk_power.power_plant_java.sevice.categories.CategoryService;
import com.dk_power.power_plant_java.sevice.categories.ValueService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/categories-api")
@RequiredArgsConstructor
public class CatRestController_r {
    private final CategoryService categoryService;
    private final ValueService valueService;
    @GetMapping("/")
    public ResponseEntity<List<String>> getAllCategoryAliases(){
        return ResponseEntity.ok (categoryService.getAll().stream().map(Category::getAlias).toList());
//        return ResponseEntity.ok (categoryService.getAll());
    }
    @GetMapping("/all")
    public ResponseEntity<List<CategoryDto>> getAllCategories(){
        return ResponseEntity.ok (categoryService.getAll().stream().map(categoryService::convertToDto).toList());
    }

    @GetMapping("/by-alias/{alias}")
    public ResponseEntity<CategoryDto> getAllCategories(@PathVariable String alias){
        return ResponseEntity.ok (categoryService.convertToDto(categoryService.getByAlias(alias)));
//        return ResponseEntity.ok (categoryService.getAll());
    }

}
