package com.dk_power.power_plant_java.controller.angular.export;

import com.dk_power.power_plant_java.controller.angular.NgApiResponse;
import com.dk_power.power_plant_java.entities.loto.LotoPoint;
import com.dk_power.power_plant_java.sevice.angular.loto.NgLotoPointService;
import com.dk_power.power_plant_java.sevice.data_transfer.ExcelWriterService;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/ng/excel")
@AllArgsConstructor
public class ExcelController {
    private final ExcelWriterService excelWriterService;
    private final NgLotoPointService lotoPointService;
    @GetMapping("/export-all")
    public ResponseEntity<NgApiResponse<String>> exportAll() {
        try{
            List<LotoPoint> all = lotoPointService.getAll();
            excelWriterService.writeLotoPointsToExcelTableWithLinks("points.xlsx", all);
            return ResponseEntity.ok(new NgApiResponse<>("Data exported successfully", "Success"));
        }catch (Exception e){
            return ResponseEntity.badRequest().body(new NgApiResponse<>(e.getMessage(), "Error exporting data"));
        }
    }
}
