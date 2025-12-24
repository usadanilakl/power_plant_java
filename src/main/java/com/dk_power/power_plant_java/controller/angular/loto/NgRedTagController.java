package com.dk_power.power_plant_java.controller.angular.loto;

import com.dk_power.power_plant_java.controller.angular.NgApiResponse;
import com.dk_power.power_plant_java.dto.permits.loto_point.LotoPointDto;
import com.dk_power.power_plant_java.dto.permits.loto_point.LotoPointIdDto;
import com.dk_power.power_plant_java.sevice.angular.loto.NgLotoPointService;
import com.dk_power.power_plant_java.sevice.loto.LotoBuilderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/ng/red-tag")
@RequiredArgsConstructor
public class NgRedTagController {
    private final NgLotoPointService lotoPointService;
    @PostMapping("/simple-build")
    public ResponseEntity<NgApiResponse<String>> simpleBuild(@RequestBody List<LotoPointIdDto> lotoPoints) {
        try {
            List<LotoPointDto> list = lotoPoints.stream().map(lotoPointService::convertIdDtoToEntity).map(lotoPointService::toDto).toList();
            LotoBuilderService.buildLotowWithNewPoints(list);
            String result = "success";
            return ResponseEntity.ok(new NgApiResponse<>(result, "Simple build completed successfully"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(new NgApiResponse<>(null, "Error during simple build: " + e.getMessage()));
        }
    }
}
