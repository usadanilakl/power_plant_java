package com.dk_power.power_plant_java.controller.permits;

import com.dk_power.power_plant_java.dto.permits.LotoDto;
import com.dk_power.power_plant_java.entities.categories.Value;
import com.dk_power.power_plant_java.entities.loto.Box;
import com.dk_power.power_plant_java.entities.loto.Loto;
import com.dk_power.power_plant_java.enums.Status;
import com.dk_power.power_plant_java.sevice.categories.CategoryService;
import com.dk_power.power_plant_java.sevice.loto.BoxService;
import com.dk_power.power_plant_java.sevice.loto.LotoService;
import jakarta.transaction.Transactional;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Set;

@AllArgsConstructor
@Controller
@RequestMapping("/lotos")
@Transactional
public class LotoController {
    private final LotoService lotoService;
    private final BoxService boxService;
    private final CategoryService categoryService;

    @GetMapping("/")
    public String showAllLotots(Model model){
        model.addAttribute("lotos", lotoService.getAll());
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
        Loto loto = lotoService.getTempPermit();
        System.out.println(loto.getId());
        List<Box> boxes = boxService.getAllBoxes();
        Box box = boxService.getEmptyBox();
        Set<Value> allEqTypes = categoryService.getEqTypes().getValues();
        model.addAttribute("loto", loto);
        model.addAttribute("boxes",boxes);
        model.addAttribute("emptyBox", box);
        model.addAttribute("systems", categoryService.getSystems().getValues());
        model.addAttribute("eqTypes", allEqTypes);
        return "loto/new-loto-form2";
    }
    @PostMapping("/autosave")
    public String autosaveLoto(@ModelAttribute("loto") LotoDto data){
        lotoService.save(data);
        System.out.println("autosave: " + data.getId());
        return "redirect:/lotos/create";
    }
    @PostMapping("/create")
    public String createdNewLoto(@ModelAttribute("loto") LotoDto tempLoto){
        Loto loto = lotoService.createNew(tempLoto);
        Box box = null;
        if(loto.getBox()==null || loto.getBox().getNumber()==0) box = boxService.assignLoto(loto);
        if (box==null) return "redirect:/lotos/create";
        lotoService.resetFields();
        return "redirect:/lotos/";
    }

    @GetMapping("/edit/{id}")
    public String editLoto(@PathVariable("id") String id, Model model){
        Loto loto = lotoService.getEntityById(Long.parseLong(id));
        List<Box> boxes = boxService.getAllBoxes();
        model.addAttribute("loto",loto);
        model.addAttribute("boxes", boxes);
        return "loto/update-loto-form2";
    }
    @PostMapping("/edit")
    public String updateLoto(@ModelAttribute LotoDto loto){
        Box box = boxService.getBoxById(loto.getBox().getId());
        Loto entity = lotoService.convertToEntity(loto);
        entity.setBox(box);
        box.setLoto(entity);
        boxService.saveBox(box);
        lotoService.save(entity);
        return "redirect:/lotos/";
    }
    @PostMapping("/status/{id}")
    public String changeStatus(@PathVariable("id") String id, @RequestParam(name="status") String status){
        Long lotoId = Long.parseLong(id);
        Status stat = Status.valueOf(status.toUpperCase());
        Loto loto = lotoService.changeStatus(lotoId,stat);
        lotoService.save(loto);
        return "redirect:/lotos/";
    }
//    @GetMapping("/sort")
//    public String sortByColumn(@RequestParam(name="column")String column, Model model){
//        List<Loto> lotos = lotoService.sortTable(column);
//        model.addAttribute("lotos", lotos);
//        model.addAttribute("statuses", Status.values());
//
//        return "loto/show-all-lotos";
//    }
//    @PostMapping("/filter")
//    public String filterByColumn(@RequestBody Map<String, String> payload, Model model){
//        List<Loto> l = lotoService.filterTable(payload);
//        model.addAttribute("lotos", l);
//        return "loto/show-all-lotos";
//    }

//    @GetMapping("/sort-history")
//    public String sortHistoryByColumn(@RequestParam(name="column")String column, Model model){
//        List<Loto> lotos = lotoService.sortTable(column);
//        model.addAttribute("lotos", lotos);
//        return "loto/show-all-lotos";
//    }

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
    public String updatePoints(@RequestBody LotoDto loto){
        Loto tempLoto = lotoService.save(loto);
        return "redirect:/lotos/create";
    }

    @PostMapping("/save-temp")
    public String saveTempLoto(@ModelAttribute("loto") LotoDto lotoDto){
        Loto tempLoto = lotoService.save(lotoDto);
        return "redirect:/lotos/add-points";
    }






}
