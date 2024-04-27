package com.dk_power.power_plant_java.controller.permits;

import com.dk_power.power_plant_java.model.permits.Loto;
import com.dk_power.power_plant_java.repository.permits.LotoRepository;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
@AllArgsConstructor
@Controller
@RequestMapping("/lotos")
public class LotoController {
    private final LotoRepository lotoRepository;
    @GetMapping("/")
    public String showAllLotots(Model model){
        model.addAttribute("lotos",lotoRepository.findAll());
        return "loto/show-all-lotos";
    }
    @GetMapping("/create")
    public String createNewLoto(Model model){
        Loto loto = new Loto();
        System.out.println(loto.getCreatedBy());
        model.addAttribute("loto", loto);
        return "loto/new-loto-form";
    }
    @PostMapping("/create")
    public String createdNewLoto(@ModelAttribute Loto loto){
        lotoRepository.save(loto);
        return "redirect:/lotos/";
    }

}
