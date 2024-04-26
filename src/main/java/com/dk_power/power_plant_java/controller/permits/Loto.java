package com.dk_power.power_plant_java.controller.permits;

import com.dk_power.power_plant_java.repository.permits.LotoRepository;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
@AllArgsConstructor
@Controller
@RequestMapping("/lotos")
public class Loto {
    private final LotoRepository lotoRepository;
    @GetMapping("/")
    public String showAllLotots(Model model){
        model.addAttribute("lotos",lotoRepository.findAll());
        return "loto/show-all-lotos";
    }
    @GetMapping("/create")
    public String createNewLoto(){
        return "loto/new-loto-form";
    }

}
