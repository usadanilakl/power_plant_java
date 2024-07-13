package com.dk_power.power_plant_java.sevice.data_transfer.data_manupulation;

import com.dk_power.power_plant_java.dto.data_transfer.HeatTraceJson;
import com.dk_power.power_plant_java.dto.data_transfer.HighilightsJson;
import com.dk_power.power_plant_java.dto.data_transfer.PidJson;

import java.util.List;

public interface TransferExcecutionService {
    void transferBypassFromExcel();
    void transferHrsgPipeFromExcel();
    void transferHrsgValvesFromExcel();
    void transferKiewitPipeFromExcel();
    void transferKiewitValveFromExcel();
    void transferLotoPointsFromExcel();
    void transferOldLotoPointsFromExcel();
    List<PidJson> getPidsFromJson();
    List<HeatTraceJson> getHtFromJson();
    List<HighilightsJson> getHighlitsFromJson();
    String getProjectRootFolder();

}
