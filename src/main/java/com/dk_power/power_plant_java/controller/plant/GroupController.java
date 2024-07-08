package com.dk_power.power_plant_java.controller.plant;


import com.dk_power.power_plant_java.entities.categories.Value;
import com.dk_power.power_plant_java.sevice.categories.CategoryService;
import com.dk_power.power_plant_java.sevice.categories.ValueService;
import jakarta.transaction.Transactional;
import lombok.AllArgsConstructor;
import org.apache.pdfbox.util.filetypedetector.FileType;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;

@AllArgsConstructor
@Controller
@RequestMapping("/group")
@Transactional
public class GroupController {
    private final CategoryService categoryService;
    private final ValueService valueService;
    @PostMapping("/create")
    public String createNewItem(@RequestParam(name="group") String group, @RequestParam(name="value") String value){
        Value newVal = valueService.saveIfNew(value, group);
        return "redirect:/lotos/create";
    }
}
