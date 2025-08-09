package com.dk_power.power_plant_java.controller.angular.loto;

import com.dk_power.power_plant_java.controller.angular.NgApiResponse;
import com.dk_power.power_plant_java.dto.permits.loto_standard.LotoStandardDto;
import com.dk_power.power_plant_java.dto.permits.loto_standard.LotoStandardIdDto;
import com.dk_power.power_plant_java.sevice.angular.loto.NgLotoStandardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RequestMapping("/ng/loto-standard")
@Component
@RestController
@RequiredArgsConstructor
public class NgLotoStandardController {
    private final NgLotoStandardService lotoStandardService;


    @PostMapping("/create-standard")
    public ResponseEntity<NgApiResponse<LotoStandardDto>> createLotoStandard(@RequestBody LotoStandardIdDto standard) {
        try {
            LotoStandardDto saved = lotoStandardService.createStandard(standard);
            return ResponseEntity.ok(new NgApiResponse<>(saved, "Standard created successfully"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(new NgApiResponse<>(null, "Error creating standard: " + e.getMessage()));
        }
    }


    @GetMapping("/get-all")
    public ResponseEntity<NgApiResponse<List<LotoStandardDto>>> getAllLotoStandards() {
        try {
            List<LotoStandardDto> standards = lotoStandardService.getAllDtos();
            return ResponseEntity.ok(new NgApiResponse<>(standards, "Loto standards retrieved successfully"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(new NgApiResponse<>(null, "Error retrieving loto standards: " + e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<NgApiResponse<LotoStandardDto>> getLotoStandardById(@PathVariable String id) {
        try {
            LotoStandardDto standard = lotoStandardService.getDtoById(id);
            return ResponseEntity.ok(new NgApiResponse<>(standard, "Loto standard retrieved successfully"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(new NgApiResponse<>(null, "Error retrieving loto standard: " + e.getMessage()));
        }
    }


}
