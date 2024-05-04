package com.dk_power.power_plant_java.controller.permits;

import com.dk_power.power_plant_java.config.AuditingConfig;
import com.dk_power.power_plant_java.dto.permits.LotoDto;
import com.dk_power.power_plant_java.entities.permits.Loto;
import com.dk_power.power_plant_java.entities.permits.LotoTemp;
import com.dk_power.power_plant_java.enums.PermitTypes;
import com.dk_power.power_plant_java.sevice.permits.LotoDtoService;
import com.dk_power.power_plant_java.sevice.permits.LotoService;
import com.dk_power.power_plant_java.sevice.permits.LotoTempService;
import com.dk_power.power_plant_java.sevice.permits.PermitNumbersService;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

@AllArgsConstructor
@Controller
@RequestMapping("/lotos")
public class LotoController {
    private final LotoService lotoService;
    private final LotoTempService lotoTempService;
    private final LotoDtoService lotoDtoService;
    private final AuditingConfig auditingConfig;
    private final PermitNumbersService permitNumbersService;
    @GetMapping("/")
    public String showAllLotots(Model model){
        model.addAttribute("lotos", lotoService.getAllLotos());
        return "loto/show-all-lotos";
    }
    @GetMapping("/create")
    public String createNewLoto(Model model){
        String name = auditingConfig.auditorProvider().getCurrentAuditor().get();
        LotoTemp loto = lotoTempService.getTempById(name);
        if(loto==null) loto=lotoTempService.saveTempLoto(new LotoTemp());
        model.addAttribute("loto", loto);
        return "loto/new-loto-form";
    }
    @PostMapping("/autosave")
    public String autosaveLoto(@ModelAttribute("loto") LotoDto data){
        LotoTemp loto = lotoTempService.getTempById(data.getCreatedBy());
        loto.copy(data);
        lotoTempService.saveTempLoto(loto);
//        return "loto/new-loto-form";
        return "redirect:/lotos/create";
    }
    @PostMapping("/create")
    public String createdNewLoto(@ModelAttribute LotoDto loto){
        Loto entity = lotoDtoService.toEntity(loto);
        entity.setLotoNum(permitNumbersService.getNumber(PermitTypes.LOTO));
        lotoService.saveLoto(entity);
        return "redirect:/lotos/";
    }

    @GetMapping("/edit/{id}")
    public String editLoto(@PathVariable("id") String id, Model model){
        Loto loto = lotoService.getLotoById(Long.parseLong(id));
        model.addAttribute("loto",loto);
        return "loto/new-loto-form";
    }

}
