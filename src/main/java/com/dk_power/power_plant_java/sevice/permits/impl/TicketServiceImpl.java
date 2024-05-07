package com.dk_power.power_plant_java.sevice.permits.impl;

import com.dk_power.power_plant_java.dto.permits.TicketDto;
import com.dk_power.power_plant_java.entities.permits.Ticket;
import com.dk_power.power_plant_java.enums.PermitTypes;
import com.dk_power.power_plant_java.enums.Status;
import com.dk_power.power_plant_java.repository.permits.TicketRepo;
import com.dk_power.power_plant_java.sevice.permits.PermitNumbersService;
import com.dk_power.power_plant_java.sevice.permits.TicketDtoService;
import com.dk_power.power_plant_java.sevice.permits.TicketService;
import com.dk_power.power_plant_java.util.Util;
import lombok.AllArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
@Service
@AllArgsConstructor
public class TicketServiceImpl implements TicketService {
    private final TicketRepo ticketRepo;
    private final PermitNumbersService permitNumbersService;
    private final TicketDtoService ticketDtoService;
    /***********************************Table Sorting and Searching:*********************************/
    private static String lastSortingRequest = "";
    private static boolean ascending = true;
    private static List<Ticket> tickets;
    private static Map<String,String> lastSetOfFileters;
    public static String getFieldByName(Ticket ticket, String fieldName){
        if(fieldName.equals("workScope")) return ticket.getWorkScope();
        else if(fieldName.equals("ticketNum")) return (""+ticket.getTicketNum());
        else if(fieldName.equals("requestor")) return ticket.getRequestor();
        return null;
    }
    public static List<Ticket> filterSwList(List<Ticket> ticket, String searchValue, String column){
        ticket.removeIf(e->!getFieldByName(e,column).contains(searchValue));
        return ticket;
    }
    public static void sortListAsc(List<Ticket> ticket, String fieldName){
        if(fieldName.equals("workScope")) ticket.sort(Comparator.comparing(Ticket::getWorkScope,Comparator.nullsLast(Comparator.naturalOrder())));
        else if(fieldName.equals("ticketNum")) ticket.sort(Comparator.comparing(Ticket::getTicketNum,Comparator.nullsLast(Comparator.naturalOrder())));
        else if(fieldName.equals("requestor")) ticket.sort(Comparator.comparing(Ticket::getRequestor,Comparator.nullsLast(Comparator.naturalOrder())));
    }
    public static void sortListDesc(List<Ticket> ticket, String fieldName){
        if(fieldName.equals("workScope")) ticket.sort(Comparator.comparing(Ticket::getWorkScope,Comparator.nullsLast(Comparator.naturalOrder())).reversed());
        else if(fieldName.equals("ticketNum")) ticket.sort(Comparator.comparing(Ticket::getTicketNum,Comparator.nullsLast(Comparator.naturalOrder())).reversed());
        else if(fieldName.equals("requestor")) ticket.sort(Comparator.comparing(Ticket::getRequestor,Comparator.nullsLast(Comparator.naturalOrder())).reversed());
    }

    /**************************************************************************************************/
    @Override
    public List<Ticket> getAll() {
        return Util.toList(ticketRepo.findAll());
    }

    @Override
    public List<Ticket> getAllSorted(Sort column) {
        return ticketRepo.findAll(column);
    }

    @Override
    public Ticket getById(Long id) {
        return ticketRepo.findById(id).orElse(null);
    }

    @Override
    public Ticket save(Ticket ticket) {
        ticketRepo.save(ticket);
        filterNew(ticket);
        return ticket;
    }

    @Override
    public Ticket createNew(TicketDto ticket) {
        Ticket entity = ticketDtoService.toEntity(ticket);
        entity.setTicketNum(permitNumbersService.getNumber(PermitTypes.TICKET));
        entity.setStatus(Status.INCATCIVE);
        filterNew(entity);
        return save(entity);
    }

    @Override
    public Ticket changeStatus(Long id, Status status) {
        Ticket ticket = getById(id);
        ticket.setStatus(status);
        return ticket;
    }

    @Override
    public List<Ticket> sortTable(String column) {
        if(tickets==null) tickets = getAll();
        if(lastSortingRequest.equals(column)){
            if(ascending) ascending = false;
            else ascending = true;
        }
        if(ascending){
            sortListAsc(tickets,column);
        }else {
            sortListDesc(tickets,column);
        }
        lastSortingRequest = column;
        return tickets;
    }

    @Override
    public List<Ticket> filterTable(Map<String, String> filters) {
        tickets = getAll();
        for(Map.Entry<String,String> e : filters.entrySet()){
            filterSwList(tickets,e.getValue(),e.getKey());
        }
        return sortTable("ticketNum");
    }

    @Override
    public List<Ticket> getLastFilter() {
        if(tickets==null || tickets.size()==0) tickets = getAll();
        return tickets;
    }

    @Override
    public List<Ticket> clearFilters() {
        tickets = getAll();
        return tickets;
    }

    @Override
    public void filterNew(Ticket ticket) {
        boolean contains = true;
        if(lastSetOfFileters!=null){
            for(Map.Entry<String,String> e : lastSetOfFileters.entrySet()){
                if(!getFieldByName(ticket,e.getKey()).contains(e.getValue())) contains = false;
            }
        }
        if(tickets!=null){
            for (Ticket el : tickets) {
                if(el.getId().equals(ticket.getId())){
                    el.copy(ticket);
                    return;
                }
            }
            if(contains)tickets.add(ticket);
        }


    }
}
