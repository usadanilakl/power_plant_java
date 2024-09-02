package com.dk_power.power_plant_java.sevice.data_transfer.data_manupulation;

import com.dk_power.power_plant_java.dto.data_transfer.*;
import com.dk_power.power_plant_java.dto.permits.LotoPointDto;
import com.dk_power.power_plant_java.entities.data_transfer.*;
import com.dk_power.power_plant_java.entities.loto.LotoPoint;
import com.dk_power.power_plant_java.sevice.data_transfer.excel.*;
import com.dk_power.power_plant_java.sevice.loto.loto_point.LotoPointService;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class DataDistributionServiceImpl implements DataDistributionService{
    private final BypassService bypassService;
    private final HrsgPipeIsoService hrsgPipeIsoService;
    private final HrsgValveService hrsgValveService;
    private final KiewitPipeIsoService kiewitPipeIsoService;
    private final KiewitValveService kiewitValveService;
    private final LotoPointService lotoPointService;
    private final OldLotoPointService oldLotoPointService;
    private final TransferExcecutionService transferExcecutionService;


//    public DataDistributionServiceImpl(@Lazy BypassRepo bypassRepo, @Lazy HrsgPipeIsoRepo hrsgPipeIsoRepo, @Lazy HrsgValveRepo hrsgValveRepo, @Lazy KiewitPipeIsoRepo kiewitPipeIsoRepo, @Lazy KiewitValveRepo kiewitValveRepo, @Lazy LotoPointRepo lotoPointRepo, @Lazy OldLotoPointRepo oldLotoPointRepo, @Lazy TransferExcecutionService transferExcecutionService) {
//        this.bypassRepo = bypassRepo;
//        this.hrsgPipeIsoRepo = hrsgPipeIsoRepo;
//        this.hrsgValveRepo = hrsgValveRepo;
//        this.kiewitPipeIsoRepo = kiewitPipeIsoRepo;
//        this.kiewitValveRepo = kiewitValveRepo;
//        this.lotoPointRepo = lotoPointRepo;
//        this.oldLotoPointRepo = oldLotoPointRepo;
//        this.transferExcecutionService = transferExcecutionService;
//    }


    @Override
    public List<Bypass> getBypasses() {
        return bypassService.getAll();
    }

    @Override
    public List<HrsgPipeIso> getHrsgPipes() {
        return hrsgPipeIsoService.getAll();
    }

    @Override
    public List<HrsgValve> getHrsgValves() {
        return hrsgValveService.getAll();
    }

    @Override
    public List<KiewitPipeIso> getKiewitPipes() {
        return kiewitPipeIsoService.getAll();
    }

    @Override
    public List<KiewitValve> getKiewitValves() {
        return kiewitValveService.getAll();
    }

    @Override
    public List<LotoPoint> getLotoPoints() {
        return lotoPointService.getAll();
    }

    @Override
    public List<OldLotoPoint> getOldLotoPoints() {
        return oldLotoPointService.getAll();
    }

    @Override
    public List<PidJson> getPidJsons() {
        return transferExcecutionService.getPidsFromJson();
    }

    @Override
    public List<HeatTraceJson> getHtJson() {
        return transferExcecutionService.getHtFromJson();
    }

    @Override
    public List<HighilightsJson> getHighlightsJson() {
        return transferExcecutionService.getHighlitsFromJson();
    }

    @Override
    public Map<String, Object> getAllTransfers() {
        Map<String,Object> all = new HashMap<>();
        all.put("HRSG Valves",getHrsgValves());
        all.put("Kiewit Valves", getKiewitValves());
        all.put("HRSG Pipes", getHrsgPipes());
        all.put("Kiewit Pipes", getKiewitPipes());
        all.put("Bypasses",getBypasses());
        all.put("Old LOTO Points", getOldLotoPoints());
        all.put("Revised LOTO Points", getLotoPoints());
        all.put("Equipment", getHighlightsJson());
        all.put("PIDs", getPidJsons());
        all.put("Heat Trace", getHtJson());
        return all;
    }

    @Override
    public List<String> getTypesOfTransferData() {
        List<String> result = new ArrayList<>();
        getAllTransfers().forEach((key,value)->result.add(key));
        return result;
    }

    @Override
    public List<BypassDto> getBypassesDto() {
        return bypassService.getAllDtos();
    }

    @Override
    public List<HrsgPipeIsoDto> getHrsgPipesDto() {
        return hrsgPipeIsoService.getAllDtos();
    }

    @Override
    public List<HrsgValveDto> getHrsgValvesDto() {
        return hrsgValveService.getAllDtos();
    }

    @Override
    public List<KiewitPipeIsoDto> getKiewitPipesDto() {
        return kiewitPipeIsoService.getAllDtos();
    }

    @Override
    public List<KiewitValveDto> getKiewitValvesDto() {
        return kiewitValveService.getAllDtos();
    }

    @Override
    public List<LotoPointDto> getLotoPointsDto() {
        return lotoPointService.getAllDtos();
    }

    @Override
    public List<OldLotoPointDto> getOldLotoPointsDto() {
        return oldLotoPointService.getAllDtos();
    }


}
