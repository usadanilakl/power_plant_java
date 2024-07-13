package com.dk_power.power_plant_java.controller.transfer_data;

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

}
