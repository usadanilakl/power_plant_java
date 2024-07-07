package com.dk_power.power_plant_java.controller.permits;

import com.dk_power.power_plant_java.dto.permits.LotoDto;
import com.dk_power.power_plant_java.dto.permits.TempLotoDto;
import com.dk_power.power_plant_java.entities2.loto.Box;
import com.dk_power.power_plant_java.entities2.loto.Loto;
import com.dk_power.power_plant_java.entities.permits.lotos.TempLoto;
import com.dk_power.power_plant_java.entities.equipment.EquipmentType;
import com.dk_power.power_plant_java.entities.Syst;
import com.dk_power.power_plant_java.enums.Status;
import com.dk_power.power_plant_java.repository.plant.EquipmentTypeRepo;
import com.dk_power.power_plant_java.sevice.loto.BoxService;
import com.dk_power.power_plant_java.sevice.permits.impl.LotoService;
import com.dk_power.power_plant_java.sevice.permits.impl.TempLotoService;
import com.dk_power.power_plant_java.sevice.plant.GroupService;
import jakarta.transaction.Transactional;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@AllArgsConstructor
@Controller
@RequestMapping("/lotos")
@Transactional
public class LotoController {
    private final LotoService lotoService;
    private final BoxService boxService;
    private final TempLotoService tempLotoService;
    private final GroupService<Syst> systemService;
    private final GroupService<EquipmentType> equipmentTypeGroupServiceService;
    private final EquipmentTypeRepo equipmentTypeRepo;

    @GetMapping("/")
    public String showAllLotots(Model model){
        model.addAttribute("lotos", lotoService.getLastFilteredList());
        model.addAttribute("statuses", Status.values());
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
        Box box = boxService.getEmptyBox();
        List<EquipmentType> allEqTypes = equipmentTypeGroupServiceService.getAll();
        model.addAttribute("loto", loto);
        model.addAttribute("boxes",boxes);
        model.addAttribute("emptyBox", box);
        model.addAttribute("systems", systemService.getAll());
        model.addAttribute("eqTypes", allEqTypes);
        return "loto/new-loto-form2";
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
        Loto loto = lotoService.createNew(tempLoto, Loto.class);
        Box box = null;
        if(loto.getBox()==null || loto.getBox().getNumber()==0) box = boxService.assignLoto(loto);
        if (box==null) return "redirect:/lotos/create";
        lotoService.filterNew(loto);
        tempLotoService.resetFields();
        return "redirect:/lotos/";
    }

    @GetMapping("/edit/{id}")
    public String editLoto(@PathVariable("id") String id, Model model){
        Loto loto = lotoService.getById(Long.parseLong(id));
        List<Box> boxes = boxService.getAllBoxes();
        model.addAttribute("loto",loto);
        model.addAttribute("boxes", boxes);
        return "loto/update-loto-form2";
    }
    @PostMapping("/edit")
    public String updateLoto(@ModelAttribute LotoDto loto){
        Box box = boxService.getBoxById(loto.getBox().getId());
        Loto entity = lotoService.convertToEntity(loto,Loto.class);
        entity.setBox(box);
        box.setLoto(entity);
        boxService.saveBox(box);
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
        model.addAttribute("statuses", Status.values());

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

    @GetMapping("/add-points")
    public String getAddPoints(Model model){
        model.addAttribute("mode","lotoMode");
        return "testRunner";
    }

    @PostMapping("/update-points")
    public String updatePoints(@RequestBody TempLotoDto loto){
        TempLoto tempLoto = tempLotoService.saveTempLotoDto(loto);
        return "redirect:/lotos/create";
    }

    @PostMapping("/save-temp")
    public String saveTempLoto(@ModelAttribute("loto") TempLotoDto lotoDto){
        TempLoto tempLoto = tempLotoService.saveTempLotoDto(lotoDto);
        return "redirect:/lotos/add-points";
    }






}
