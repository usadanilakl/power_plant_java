package com.dk_power.power_plant_java.controller.permits;

import com.dk_power.power_plant_java.config.AuditingConfig;
import com.dk_power.power_plant_java.dto.permits.LotoDto;
import com.dk_power.power_plant_java.entities.permits.Loto;
import com.dk_power.power_plant_java.entities.permits.LotoTemp;
import com.dk_power.power_plant_java.enums.PermitTypes;
import com.dk_power.power_plant_java.enums.Status;
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
        LotoTemp loto = lotoTempService.getTempById();
        model.addAttribute("loto", loto);
        return "loto/new-loto-form";
    }
    @PostMapping("/autosave")
    public String autosaveLoto(@ModelAttribute("loto") LotoDto data){
        LotoTemp loto = lotoTempService.getTempById();
        loto.copy(data);
        lotoTempService.saveTempLoto(loto);
//        return "loto/new-loto-form";
        return "redirect:/lotos/create";
    }
    @PostMapping("/create")
    public String createdNewLoto(@ModelAttribute LotoDto loto){
        lotoService.createNewLoto(loto);
        lotoTempService.resetFields();
        return "redirect:/lotos/";
    }

    @GetMapping("/edit/{id}")
    public String editLoto(@PathVariable("id") String id, Model model){
        Loto loto = lotoService.getLotoById(Long.parseLong(id));
        model.addAttribute("loto",loto);
        return "loto/update-loto-form";
    }
    @PostMapping("/edit")
    public String updateLoto(@ModelAttribute LotoDto loto){
        Loto entity = lotoService.getLotoById(loto.getId());
        entity.copy(loto);
        lotoService.saveLoto(entity);
        return "redirect:/lotos/";
    }
    @PostMapping("/status/{id}")
    public String changeStatus(@PathVariable("id") String id, @RequestParam(name="status") String status){
        Long lotoId = Long.parseLong(id);
        Status stat = Status.valueOf(status.toUpperCase());
        Loto loto = lotoService.changeStatus(lotoId,stat);
        lotoService.saveLoto(loto);
        System.out.println(loto.getStatus());
        return "redirect:/lotos/";
    }





}
