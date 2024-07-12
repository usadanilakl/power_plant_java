package com.dk_power.power_plant_java.sevice.data_transfer.json;

import com.dk_power.power_plant_java.dto.data_transfer.HeatTraceJson;

public class HeatTraceTransferService implements JsonToPojoService<HeatTraceJson> {
    @Override
    public HeatTraceJson getEntity() {
        return new HeatTraceJson();
    }
}
