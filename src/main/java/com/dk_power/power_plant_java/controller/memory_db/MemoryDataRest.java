package com.dk_power.power_plant_java.controller.memory_db;

import com.dk_power.power_plant_java.sevice.data_transfer.data_manupulation.DataDistributionService;
import com.dk_power.power_plant_java.sevice.memory_repo.DataLoadingService;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/memory-data")
@AllArgsConstructor
public class MemoryDataRest {
    private final DataLoadingService dataLoadingService;

    @GetMapping("/all")
    public ResponseEntity<Map<String,Object>> getAllData(){
        return ResponseEntity.ok(dataLoadingService.getAllData());
    }

}
