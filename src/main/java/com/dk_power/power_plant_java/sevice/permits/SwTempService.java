package com.dk_power.power_plant_java.sevice.permits;

import com.dk_power.power_plant_java.entities.permits.LotoTemp;
import com.dk_power.power_plant_java.entities.permits.SwTemp;

import java.util.Optional;

public interface SwTempService {
    SwTemp saveTempSw(SwTemp sw);
    SwTemp getTempById();
    Optional<SwTemp> getTempByUser(String user);
    SwTemp deleteTemp(SwTemp sw);
    void resetFields();
}
