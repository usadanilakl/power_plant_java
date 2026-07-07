package com.dk_power.power_plant_java.controller.angular.loto;

import com.dk_power.power_plant_java.controller.angular.NgApiResponse;
import com.dk_power.power_plant_java.dto.automation.AutomationSessionState;
import com.dk_power.power_plant_java.dto.permits.LotoDto;
import com.dk_power.power_plant_java.dto.permits.loto_point.LotoPointDto;
import com.dk_power.power_plant_java.dto.permits.loto_point.LotoPointIdDto;
import com.dk_power.power_plant_java.sevice.angular.loto.NgLotoPointService;
import com.dk_power.power_plant_java.sevice.angular.loto.NgLotoService;
import com.dk_power.power_plant_java.sevice.automation.RedTagStepExecutionService;
import com.dk_power.power_plant_java.sevice.loto.LotoBuilderService;
import jakarta.persistence.EntityNotFoundException;
import com.dk_power.power_plant_java.config.security.RestrictedAllowed;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/ng/red-tag")
@RequiredArgsConstructor
@RestrictedAllowed
public class NgRedTagController {
    private final NgLotoPointService lotoPointService;
    private final NgLotoService lotoService;
    private final RedTagStepExecutionService redTagStepExecutionService;

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

    @PostMapping("/full-build/{lotoId}")
    public ResponseEntity<NgApiResponse<AutomationSessionState>> fullBuild(@PathVariable Long lotoId) {
        try {
            LotoDto dto = lotoService.findDtoById(lotoId)
                    .orElseThrow(() -> new EntityNotFoundException("Loto not found with id: " + lotoId));
            AutomationSessionState session = redTagStepExecutionService.startLotoBuild(dto);
            return ResponseEntity.ok(new NgApiResponse<>(session, "LOTO build started"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(new NgApiResponse<>(null, "Error starting LOTO build: " + e.getMessage()));
        }
    }
}
