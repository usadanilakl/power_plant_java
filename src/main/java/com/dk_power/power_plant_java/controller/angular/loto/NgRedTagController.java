package com.dk_power.power_plant_java.controller.angular.loto;

import com.dk_power.power_plant_java.controller.angular.NgApiResponse;
import com.dk_power.power_plant_java.dto.permits.LotoPointDto;
import com.dk_power.power_plant_java.sevice.loto.LotoBuilderService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/ng/red-tag")
public class NgRedTagController {
    @PostMapping("/simple-build")
    public ResponseEntity<NgApiResponse<String>> simpleBuild(@RequestBody List<LotoPointDto> lotoPoints) {
        try {
            LotoBuilderService.buildLotowWithNewPoints(lotoPoints);
            String result = "success";
            return ResponseEntity.ok(new NgApiResponse<>(result, "Simple build completed successfully"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(new NgApiResponse<>(null, "Error during simple build: " + e.getMessage()));
        }
    }
}
