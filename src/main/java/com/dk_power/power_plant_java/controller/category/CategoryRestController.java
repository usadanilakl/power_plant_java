package com.dk_power.power_plant_java.controller.category;

import com.dk_power.power_plant_java.dto.categories.CategoryDto;
import com.dk_power.power_plant_java.dto.categories.ValueDto;
import com.dk_power.power_plant_java.entities.categories.Category;
import com.dk_power.power_plant_java.entities.categories.Value;
import com.dk_power.power_plant_java.sevice.categories.CategoryService;
import com.dk_power.power_plant_java.sevice.categories.ValueService;
import com.dk_power.power_plant_java.util.Util;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("/category")
@RequiredArgsConstructor
public class CategoryRestController {
    private final CategoryService categoryService;
    private final ValueService valueService;

    @GetMapping("/get-eqType")
    public ResponseEntity<Set<ValueDto>> getValues(){
        return ResponseEntity.ok(categoryService.getEqTypes());
    }
    @GetMapping("/get-vendor")
    public ResponseEntity<Set<ValueDto>> getVendors(){
        return ResponseEntity.ok(categoryService.getVendors());
    }
    @GetMapping("/get-system")
    public ResponseEntity<Set<ValueDto>> getSystems(){
        return ResponseEntity.ok(categoryService.getSystems());
    }

    @GetMapping("/get-location")
    public ResponseEntity<Set<ValueDto>> getLocations(){
        return ResponseEntity.ok(categoryService.getLocations());
    }
    @GetMapping("/get-isoPos")
    public ResponseEntity<Set<ValueDto>> getIsoPositions(){
        return ResponseEntity.ok(categoryService.getIsoPositions());
    }
    @GetMapping("/get-normPos")
    public ResponseEntity<Set<ValueDto>> getNormPositions(){
        return ResponseEntity.ok(categoryService.getNormPositions());
    }
    @GetMapping("/get-fileType")
    public ResponseEntity<Set<ValueDto>> getFileTypes(){
        return ResponseEntity.ok(categoryService.getFileTypes());
    }
    @PostMapping("/{cat}/{val}")
    public ResponseEntity<Set<ValueDto>> createNewValue(@PathVariable String cat, @PathVariable String val){
        valueService.valueSetupWithAlias(cat,val);
        return ResponseEntity.ok(categoryService.getVAluesOfCatWithAlias(cat));
    }
    @PutMapping("/{cat}/{val}/{newVal}")
    public ResponseEntity<Set<ValueDto>>putValue(@PathVariable String cat, @PathVariable String val,@PathVariable String newVal){
        Value value = valueService.valueSetupWithAlias(cat, val);
        value.setName(newVal);
        Value save = valueService.save(value);
        System.out.println(save.getName() + " " + newVal);
        return ResponseEntity.ok(categoryService.getVAluesOfCatWithAlias(cat));
    }
    @DeleteMapping("/{cat}/{val}") //this was replaced by /values/
    public ResponseEntity<Set<ValueDto>>deleteValue(@PathVariable String cat, @PathVariable String val){
        Value value = valueService.valueSetup(Util.firstLetterToUpperCase(cat), val);
        valueService.softDelete(value.getId());
        return ResponseEntity.ok(categoryService.getValuesOfCat(Util.firstLetterToUpperCase(cat)));
    }
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
