package com.dk_power.power_plant_java.sevice.data_transfer.json;

import com.dk_power.power_plant_java.dto.data_transfer.PidJson;

public class PidTransferService implements JsonToPojoService<PidJson>{
    @Override
    public PidJson getEntity() {
        return new PidJson();
    }
}
