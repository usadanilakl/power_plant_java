package com.dk_power.power_plant_java.sevice.permits;

import com.dk_power.power_plant_java.dto.permits.TicketDto;
import com.dk_power.power_plant_java.entities.permits.Ticket;
import com.dk_power.power_plant_java.enums.Status;
import org.springframework.data.domain.Sort;

import java.util.List;
import java.util.Map;

public interface TicketService {
    List<Ticket> getAll();
    List<Ticket> getAllSorted(Sort column);
    Ticket getById(Long id);
    Ticket save(Ticket ticket);
    Ticket createNew(TicketDto ticket);
    Ticket changeStatus(Long id, Status status);
    List<Ticket> sortTable(String column);
    List<Ticket> filterTable(Map<String,String> filters);
    List<Ticket> getLastFilter();
    List<Ticket> clearFilters();
    public void filterNew(Ticket ticket);


}
