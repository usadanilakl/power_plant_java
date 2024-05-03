package com.dk_power.power_plant_java.controller.permits;

import com.dk_power.power_plant_java.dto.permits.LotoDto;
import com.dk_power.power_plant_java.entities.permits.Loto;
import com.dk_power.power_plant_java.repository.permits.LotoDtoRepo;
import com.dk_power.power_plant_java.sevice.users.impl.CustomUserDetails;
import lombok.AllArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

@AllArgsConstructor
@Controller
@RequestMapping("/lotos")
public class LotoController {
    private final LotoDtoRepo lotoRepo;
    @GetMapping("/")
    public String showAllLotots(Model model){
        model.addAttribute("lotos", lotoRepo.findAll());
        return "loto/show-all-lotos";
    }
    @GetMapping("/create")
    public String createNewLoto(Model model){
        LotoDto loto = new LotoDto();
        model.addAttribute("loto", loto);
        return "loto/new-loto-form";
    }
    @PostMapping("/create")
    public String createdNewLoto(@ModelAttribute LotoDto loto){
        lotoRepo.save(loto);
        return "redirect:/lotos/";
    }

    @GetMapping("/edit/{id}")
    public String editLoto(@PathVariable("id") String id, Model model){
        LotoDto loto = lotoRepo.findById(Long.parseLong(id)).get();
        System.out.println(loto.getCreatedBy());
        System.out.println(((CustomUserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal()).getName());
        model.addAttribute("loto",loto);
        return "loto/new-loto-form";
    }

}
