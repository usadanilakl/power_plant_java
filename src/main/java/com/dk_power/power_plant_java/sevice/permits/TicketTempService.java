package com.dk_power.power_plant_java.sevice.permits;

import com.dk_power.power_plant_java.entities.permits.TicketTemp;

public interface TicketTempService {
    TicketTemp saveTempSw(TicketTemp sw);
    TicketTemp getTempById();
    TicketTemp deleteTemp(TicketTemp sw);
    void resetFields();
}
