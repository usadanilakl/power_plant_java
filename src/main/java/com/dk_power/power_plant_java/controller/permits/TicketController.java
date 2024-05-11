package com.dk_power.power_plant_java.controller.permits;

import com.dk_power.power_plant_java.dto.permits.TicketDto;
import com.dk_power.power_plant_java.entities.permits.tickets.BaseTicket;
import com.dk_power.power_plant_java.entities.permits.tickets.Ticket;
import com.dk_power.power_plant_java.enums.Status;
import com.dk_power.power_plant_java.sevice.permits.impl.TicketService;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@AllArgsConstructor
@Controller
@RequestMapping("/tickets")
public class TicketController {
    private final TicketService ticketService;

    @GetMapping("/")
    public String showAll(Model model){
        model.addAttribute("tickets", ticketService.getLastFilteredList());
        return "ticket/show-all";
    }
    @GetMapping("/create")
    public String createNew(Model model){
        BaseTicket sw = ticketService.getByCreatedBy();
        model.addAttribute("sw", sw);
        return "ticket/new-form";
    }
    @PostMapping("/autosave")
    public String autosaveLoto(@ModelAttribute("sw") TicketDto data){
        BaseTicket sw = ticketService.getByCreatedBy();
        sw.copy(data);
        ticketService.saveTempTicket(sw);
        return "redirect:/tickets/create";
    }
    @PostMapping("/create")
    public String createdNewLoto(@ModelAttribute TicketDto sw){
        ticketService.createNew(sw);
        ticketService.resetFields();
        return "redirect:/tickets/";
    }

    @GetMapping("/edit/{id}")
    public String editLoto(@PathVariable("id") String id, Model model){
        Ticket sw = ticketService.getById(Long.parseLong(id));
        model.addAttribute("sw",sw);
        return "ticket/update-form";
    }
    @PostMapping("/edit")
    public String updateLoto(@ModelAttribute TicketDto sw){
        Ticket entity = ticketService.getById(sw.getId());
        entity.copy(sw);
        ticketService.save(entity);
        return "redirect:/tickets/";
    }
    @PostMapping("/status/{id}")
    public String changeStatus(@PathVariable("id") String id, @RequestParam(name="status") String status){
        Long docId = Long.parseLong(id);
        Status stat = Status.valueOf(status.toUpperCase());
        Ticket sw = ticketService.changeStatus(docId,stat);
        ticketService.save(sw);
        return "redirect:/tickets/";
    }
    @GetMapping("/sort")
    public String sortByColumn(@RequestParam(name="column")String column, Model model){
        List<Ticket> swList = ticketService.sortTable(column);
        model.addAttribute("swList", swList);
        return "ticket/show-all";
    }
    @PostMapping("/filter")
    public String filterByColumn(@RequestBody Map<String, String> payload, Model model){
        List<Ticket> l = ticketService.filterTable(payload);
        model.addAttribute("swList", l);
        return "ticket/show-all";
    }






}
