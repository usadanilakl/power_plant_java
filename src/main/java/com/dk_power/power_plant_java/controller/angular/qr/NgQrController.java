package com.dk_power.power_plant_java.controller.angular.qr;

import com.dk_power.power_plant_java.config.security.RestrictedAllowed;
import com.dk_power.power_plant_java.controller.angular.NgApiResponse;
import com.dk_power.power_plant_java.dto.equipment.EquipmentDto;
import com.dk_power.power_plant_java.entities.equipment.Equipment;
import com.dk_power.power_plant_java.repository.equipment.EquipmentRepo;
import com.dk_power.power_plant_java.sevice.angular.NgEquipmentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/ng/qr")
@RequiredArgsConstructor
@Slf4j
@RestrictedAllowed
public class NgQrController {

    private final EquipmentRepo equipmentRepo;
    private final NgEquipmentService ngEquipmentService;

    @GetMapping("/equipment/{tagNumber}")
    public ResponseEntity<NgApiResponse<Map<String, Object>>> getEquipmentByTagNumber(
            @PathVariable String tagNumber) {
        try {
            Optional<Equipment> equipmentOpt = equipmentRepo.findFirstActiveByTagNumberIgnoreCase(tagNumber);
            if (equipmentOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            Equipment equipment = equipmentOpt.get();
            EquipmentDto targetDto = ngEquipmentService.toDto(equipment);

            // Get all equipment on the same P&ID for shape overlays
            List<EquipmentDto> equipmentOnPid = List.of();
            if (equipment.getMainFile() != null) {
                equipmentOnPid = equipmentRepo.findByMainFile_Id(equipment.getMainFile().getId())
                        .stream()
                        .map(ngEquipmentService::toDto)
                        .toList();
            }

            Map<String, Object> result = Map.of(
                    "target", targetDto,
                    "equipmentOnPid", equipmentOnPid
            );

            log.info("[QR] Equipment lookup: tagNumber={}, found={}", tagNumber, true);
            return ResponseEntity.ok(new NgApiResponse<>(result, "Equipment found"));
        } catch (Exception e) {
            log.error("[QR] Equipment lookup failed: tagNumber={}, error={}", tagNumber, e.getMessage(), e);
            return ResponseEntity.badRequest()
                    .body(new NgApiResponse<>(null, "Lookup failed: " + e.getMessage()));
        }
    }
}
