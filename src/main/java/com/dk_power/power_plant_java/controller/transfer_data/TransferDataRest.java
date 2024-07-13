package com.dk_power.power_plant_java.controller.transfer_data;

import com.dk_power.power_plant_java.dto.data_transfer.HeatTraceJson;
import com.dk_power.power_plant_java.dto.data_transfer.HighilightsJson;
import com.dk_power.power_plant_java.dto.data_transfer.PidJson;
import com.dk_power.power_plant_java.entities.data_transfer.*;
import com.dk_power.power_plant_java.entities.equipment.LotoPoint;
import com.dk_power.power_plant_java.sevice.data_transfer.data_manupulation.DataDistributionService;
import com.dk_power.power_plant_java.sevice.memory_repo.DataLoadingService;
import lombok.AllArgsConstructor;
import org.springframework.context.annotation.Lazy;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/transfer-data")
@AllArgsConstructor
public class TransferDataRest {
    private final DataDistributionService dataDistributionService;
    private final DataLoadingService dataLoadingService;


    @GetMapping("/types")
    public ResponseEntity<List<String>> getTypes(){
        List<String> types = dataDistributionService.getTypesOfTransferData();
        return ResponseEntity.ok(types);
    }
    @GetMapping("/all")
    public ResponseEntity<Map<String,Object>> getAllData(){
        return ResponseEntity.ok(dataDistributionService.getAllTransfers());
    }
    @GetMapping("/old-loto-points")
    public ResponseEntity<List<OldLotoPoint>> getOldPoints(){
        return ResponseEntity.ok(dataDistributionService.getOldLotoPoints());
    }
    @GetMapping("/loto-points")
    public ResponseEntity<List<LotoPoint>> getPoints(){
        return ResponseEntity.ok(dataDistributionService.getLotoPoints());
    }
    @GetMapping("/pids")
    public ResponseEntity<List<PidJson>> getPids(){
        return ResponseEntity.ok(dataDistributionService.getPidJsons());
    }
    @GetMapping("/ht")
    public ResponseEntity<List<HeatTraceJson>> getHts(){
        return ResponseEntity.ok(dataDistributionService.getHtJson());
    }
    @GetMapping("/highlights")
    public ResponseEntity<List<HighilightsJson>> getHighlights(){
        return ResponseEntity.ok(dataDistributionService.getHighlightsJson());
    }
    @GetMapping("/hrsg-valves")
    public ResponseEntity<List<HrsgValve>> getHrsgValves(){
        return ResponseEntity.ok(dataDistributionService.getHrsgValves());
    }
    @GetMapping("/hrsg-pipes")
    public ResponseEntity<List<HrsgPipeIso>> getHrsgPipies(){
        return ResponseEntity.ok(dataDistributionService.getHrsgPipes());
    }
    @GetMapping("/kiewit-valves")
    public ResponseEntity<List<KiewitValve>> getKiewitValves(){
        return ResponseEntity.ok(dataDistributionService.getKiewitValves());
    }
    @GetMapping("/kiewit-pipes")
    public ResponseEntity<List<KiewitPipeIso>> getKiewitPipies(){
        return ResponseEntity.ok(dataDistributionService.getKiewitPipes());
    }
    @GetMapping("/bypasses")
    public ResponseEntity<List<Bypass>> getBypass(){
        return ResponseEntity.ok(dataDistributionService.getBypasses());
    }

}
