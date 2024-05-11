package com.dk_power.power_plant_java.controller.permits;

import com.dk_power.power_plant_java.dto.permits.SwDto;
import com.dk_power.power_plant_java.entities.permits.safe_works.BaseSw;
import com.dk_power.power_plant_java.entities.permits.safe_works.Sw;
import com.dk_power.power_plant_java.enums.Status;
import com.dk_power.power_plant_java.sevice.permits.impl.SwService;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@AllArgsConstructor
@Controller
@RequestMapping("/safe_work")
public class SwController {
    private final SwService swService;

    @GetMapping("/")
    public String showAllLotots(Model model){
        model.addAttribute("swList", swService.getLastFilteredList());
        return "safe_work/show-all-sw";
    }
    @GetMapping("/create")
    public String createNewSw(Model model){
        BaseSw sw = swService.getByCreatedBy();
        model.addAttribute("sw", sw);
        return "safe_work/new-sw-form";
    }
    @PostMapping("/autosave")
    public String autosaveLoto(@ModelAttribute("sw") SwDto data){
        BaseSw sw = swService.getByCreatedBy();
        sw.copy(data);
        swService.saveTempSw(sw);
        return "redirect:/safe_work/create";
    }
    @PostMapping("/create")
    public String createdNewLoto(@ModelAttribute SwDto sw){
        swService.createNew(sw);
        swService.resetFields();
        return "redirect:/safe_work/";
    }

    @GetMapping("/edit/{id}")
    public String editLoto(@PathVariable("id") String id, Model model){
        Sw sw = swService.getById(Long.parseLong(id));
        model.addAttribute("sw",sw);
        return "safe_work/update-sw-form";
    }
    @PostMapping("/edit")
    public String updateLoto(@ModelAttribute SwDto sw){
        Sw entity = swService.getById(sw.getId());
        entity.copy(sw);
        swService.save(entity);
        return "redirect:/safe_work/";
    }
    @PostMapping("/status/{id}")
    public String changeStatus(@PathVariable("id") String id, @RequestParam(name="status") String status){
        Long docId = Long.parseLong(id);
        Status stat = Status.valueOf(status.toUpperCase());
        Sw sw = swService.changeStatus(docId,stat);
        swService.save(sw);
        return "redirect:/lotos/";
    }
    @GetMapping("/sort")
    public String sortByColumn(@RequestParam(name="column")String column, Model model){
        List<Sw> swList = swService.sortTable(column);
        model.addAttribute("swList", swList);
        System.out.println("sort");
        return "safe_work/show-all-sw";
    }
    @PostMapping("/filter")
    public String filterByColumn(@RequestBody Map<String, String> payload, Model model){
        List<Sw> l = swService.filterTable(payload);
        model.addAttribute("swList", l);
        return "safe_work/show-all-sw";
    }






}
