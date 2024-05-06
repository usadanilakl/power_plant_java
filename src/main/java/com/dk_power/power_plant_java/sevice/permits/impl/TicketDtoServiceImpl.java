package com.dk_power.power_plant_java.sevice.permits.impl;

import com.dk_power.power_plant_java.dto.permits.TicketDto;
import com.dk_power.power_plant_java.entities.permits.Ticket;
import com.dk_power.power_plant_java.sevice.permits.TicketDtoService;

public class TicketDtoServiceImpl implements TicketDtoService {
    @Override
    public TicketDto toDto(Ticket ticket) {
        return new TicketDto(ticket.getRequestor(),ticket.getControlAuthority(),ticket.getSystem(),ticket.getWorkScope(), ticket.getEquipment(), ticket.getCreatedBy(), ticket.getLotos(),ticket.getSwList());
    }

    @Override
    public Ticket toEntity(TicketDto ticket) {
        return new Ticket(ticket.getWorkScope(), ticket.getSystem(), ticket.getEquipment(), ticket.getRequestor(), ticket.getControlAuthority(), ticket.getLotos(), ticket.getSwList());
    }
}
