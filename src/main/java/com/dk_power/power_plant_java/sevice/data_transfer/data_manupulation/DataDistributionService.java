package com.dk_power.power_plant_java.sevice.data_transfer.data_manupulation;

import com.dk_power.power_plant_java.dto.data_transfer.*;
import com.dk_power.power_plant_java.dto.permits.LotoPointDto;
import com.dk_power.power_plant_java.entities.data_transfer.*;
import com.dk_power.power_plant_java.entities.loto.LotoPoint;

import java.util.List;
import java.util.Map;

public interface DataDistributionService {
    List<Bypass> getBypasses();
    List<HrsgPipeIso> getHrsgPipes();
    List<HrsgValve> getHrsgValves();
    List<KiewitPipeIso> getKiewitPipes();
    List<KiewitValve> getKiewitValves();
    List<LotoPoint> getLotoPoints();
    List<OldLotoPoint> getOldLotoPoints();
    List<PidJson> getPidJsons();
    List<HeatTraceJson> getHtJson();
    List<HighilightsJson> getHighlightsJson();
    Map<String,Object> getAllTransfers();
    List<String> getTypesOfTransferData();

    List<BypassDto> getBypassesDto();
    List<HrsgPipeIsoDto> getHrsgPipesDto();
    List<HrsgValveDto> getHrsgValvesDto();
    List<KiewitPipeIsoDto> getKiewitPipesDto();
    List<KiewitValveDto> getKiewitValvesDto();
    List<LotoPointDto> getLotoPointsDto();
    List<OldLotoPointDto> getOldLotoPointsDto();


}
