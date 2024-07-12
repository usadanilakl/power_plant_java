package com.dk_power.power_plant_java.sevice.data_transfer.json;

import com.dk_power.power_plant_java.dto.data_transfer.HeatTraceJson;
import org.springframework.stereotype.Service;

@Service
public class HeatTraceTransferService implements JsonToPojoService<HeatTraceJson> {
    @Override
    public HeatTraceJson getEntity() {
        return new HeatTraceJson();
    }
}
