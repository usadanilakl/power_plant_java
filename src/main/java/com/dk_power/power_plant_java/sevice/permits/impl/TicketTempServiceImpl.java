package com.dk_power.power_plant_java.sevice.permits.impl;

import com.dk_power.power_plant_java.config.AuditingConfig;
import com.dk_power.power_plant_java.dto.permits.TicketDto;
import com.dk_power.power_plant_java.entities.permits.TicketTemp;
import com.dk_power.power_plant_java.repository.permits.TicketTempRepo;
import com.dk_power.power_plant_java.sevice.permits.TicketTempService;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@AllArgsConstructor
public class TicketTempServiceImpl implements TicketTempService {
    private final TicketTempRepo ticketTempRepo;
    private final AuditingConfig auditingConfig;

    @Override
    public TicketTemp saveTempSw(TicketTemp sw) {
        ticketTempRepo.save(sw);
        return sw;
    }

    @Override
    public TicketTemp getTempById() {
        String id = auditingConfig.auditorProvider().getCurrentAuditor().get();
        TicketTemp ticket = ticketTempRepo.findById(id).orElse(null);
        if(ticket==null) ticket = saveTempSw(new TicketTemp());
        return ticket;
    }


    @Override
    public TicketTemp deleteTemp(TicketTemp sw) {
        ticketTempRepo.delete(sw);
        return sw;
    }

    @Override
    public void resetFields() {
        TicketTemp ticket = getTempById();
        ticket.copy(new TicketDto());
        saveTempSw(ticket);
    }
}
