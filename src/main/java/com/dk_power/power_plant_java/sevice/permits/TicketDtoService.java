package com.dk_power.power_plant_java.sevice.permits;

import com.dk_power.power_plant_java.dto.permits.TicketDto;
import com.dk_power.power_plant_java.entities.permits.Ticket;

public interface TicketDtoService {
    TicketDto toDto(Ticket ticket);
    Ticket toEntity(TicketDto ticket);
}
