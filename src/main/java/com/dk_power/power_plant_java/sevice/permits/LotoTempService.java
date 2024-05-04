package com.dk_power.power_plant_java.sevice.permits;

import com.dk_power.power_plant_java.entities.permits.LotoTemp;

import java.util.Optional;

public interface LotoTempService {
    LotoTemp saveTempLoto(LotoTemp loto);
    LotoTemp getTempById();
    Optional<LotoTemp> getTempByUser(String user);
    LotoTemp deleteTemp(LotoTemp loto);
    void resetFields();
}
