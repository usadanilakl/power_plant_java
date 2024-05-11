package com.dk_power.power_plant_java.sevice.permits.impl;

import com.dk_power.power_plant_java.dto.permits.TicketDto;
import com.dk_power.power_plant_java.entities.permits.tickets.BaseTicket;
import com.dk_power.power_plant_java.entities.permits.tickets.Ticket;
import com.dk_power.power_plant_java.repository.permits.BasePermitRepo;
import com.dk_power.power_plant_java.repository.permits.ticket_repo.BaseTicketRepo;
import com.dk_power.power_plant_java.sevice.permits.PermitNumbersService;
import com.dk_power.power_plant_java.sevice.users.impl.UserDetailsServiceImpl;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

@Service
public class TicketService extends BasePermitServiceImpl<Ticket, TicketDto>{
    private final BaseTicketRepo ticketRepo;

    public TicketService(@Qualifier("ticketRepo") BasePermitRepo<Ticket> repository, PermitNumbersService permitNumbersService, FilterService<Ticket> filterService, UserDetailsServiceImpl customUserDetails, BaseTicketRepo ticketRepo) {
        super(repository, permitNumbersService, filterService, customUserDetails);
        this.ticketRepo = ticketRepo;
    }

    public BaseTicket saveTempTicket(BaseTicket sw){
        ticketRepo.save(sw);
        return sw;
    }

}
