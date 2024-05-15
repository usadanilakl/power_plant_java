package com.dk_power.power_plant_java.controller.permits;

import com.dk_power.power_plant_java.dto.permits.BaseLotoDto;
import com.dk_power.power_plant_java.dto.permits.LotoDto;
import com.dk_power.power_plant_java.entities.permits.lotos.BaseLoto;
import com.dk_power.power_plant_java.entities.permits.lotos.Box;
import com.dk_power.power_plant_java.entities.permits.lotos.Loto;
import com.dk_power.power_plant_java.entities.permits.lotos.TempLoto;
import com.dk_power.power_plant_java.enums.Status;
import com.dk_power.power_plant_java.sevice.permits.BoxService;
import com.dk_power.power_plant_java.sevice.permits.impl.BaseLotoService;
import com.dk_power.power_plant_java.sevice.permits.impl.LotoService;
import com.dk_power.power_plant_java.sevice.permits.impl.TempLotoService;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@AllArgsConstructor
@Controller
@RequestMapping("/lotos")
public class LotoController {
    private final LotoService lotoService;
    private final BoxService boxService;
    private final TempLotoService tempLotoService;

    @GetMapping("/")
    public String showAllLotots(Model model){
        model.addAttribute("lotos", lotoService.getLastFilteredList());
        return "loto/show-all-lotos";
    }
    @GetMapping("/history/{id}")
    public String showAHistory(@PathVariable("id") String id,Model model){
        List<Loto> revision = lotoService.getRevision(Long.parseLong(id), Loto.class);
        model.addAttribute("lotos", revision);
        return "loto/permit-history";
    }
    @GetMapping("/create")
    public String createNewLoto(Model model){
        TempLoto loto = tempLotoService.getTempPermit();
        List<Box> boxes = boxService.getAllBoxes();
        model.addAttribute("loto", loto);
        model.addAttribute("boxes",boxes);
        return "loto/new-loto-form";
    }
    @PostMapping("/autosave")
    public String autosaveLoto(@ModelAttribute("loto") LotoDto data){
        TempLoto loto = tempLotoService.getTempPermit();
        loto.copy(data);
        tempLotoService.saveTempLoto(loto);
        return "redirect:/lotos/create";
    }
    @PostMapping("/create")
    public String createdNewLoto(@ModelAttribute("loto") LotoDto tempLoto){
        Loto aNew = lotoService.createNew(tempLoto, Loto.class);
        if(aNew.getBox()==null || aNew.getBox().getNumber()==0) boxService.assignLoto(aNew);
        lotoService.filterNew(aNew);
        tempLotoService.resetFields();
        return "redirect:/lotos/";
    }

    @GetMapping("/edit/{id}")
    public String editLoto(@PathVariable("id") String id, Model model){
        Loto loto = lotoService.getById(Long.parseLong(id));
        model.addAttribute("loto",loto);
        return "loto/update-loto-form";
    }
    @PostMapping("/edit")
    public String updateLoto(@ModelAttribute LotoDto loto){
        Loto entity = lotoService.getById(loto.getId());
        entity.copy(loto);
        lotoService.save(entity);
        lotoService.filterNew(entity);
        return "redirect:/lotos/";
    }
    @PostMapping("/status/{id}")
    public String changeStatus(@PathVariable("id") String id, @RequestParam(name="status") String status){
        Long lotoId = Long.parseLong(id);
        Status stat = Status.valueOf(status.toUpperCase());
        Loto loto = lotoService.changeStatus(lotoId,stat);
        lotoService.save(loto);
        lotoService.filterNew(loto);
        return "redirect:/lotos/";
    }
    @GetMapping("/sort")
    public String sortByColumn(@RequestParam(name="column")String column, Model model){
        List<Loto> lotos = lotoService.sortTable(column);
        model.addAttribute("lotos", lotos);
        return "loto/show-all-lotos";
    }
    @PostMapping("/filter")
    public String filterByColumn(@RequestBody Map<String, String> payload, Model model){
        List<Loto> l = lotoService.filterTable(payload);
        model.addAttribute("lotos", l);
        return "loto/show-all-lotos";
    }

    @GetMapping("/sort-history")
    public String sortHistoryByColumn(@RequestParam(name="column")String column, Model model){
        List<Loto> lotos = lotoService.sortTable(column);
        model.addAttribute("lotos", lotos);
        return "loto/show-all-lotos";
    }

    @PostMapping("/add-box")
    public String addNewBox(){
        boxService.addNewBox();
        return "redirect:/lotos/create";
    }






}
