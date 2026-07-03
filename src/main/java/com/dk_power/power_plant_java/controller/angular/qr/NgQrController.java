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
            // Use the list variant instead of findFirst so we can detect
            // duplicate active tags. Equipment.tagNumber has no uniqueness
            // constraint (grep for @Column(unique=...) returns nothing), so
            // two rows with the same tag can quietly coexist. The old
            // findFirst path returned one of them non-deterministically —
            // scanning the same physical QR could route to different
            // equipment on different calls depending on the DB planner.
            List<Equipment> matches = equipmentRepo.findAllActiveByTagNumberIgnoreCase(tagNumber);
            if (matches.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            // The list is ORDER BY id ASC, so "first" is deterministic.
            // We still return a result on duplicates so the field worker's
            // scan flow doesn't hard-fail — but we ATTACH A WARNING so the
            // frontend can render a "this tag matches N pieces of equipment"
            // banner, and we log the collision LOUD so it shows up in ops.
            Equipment equipment = matches.get(0);
            EquipmentDto targetDto = ngEquipmentService.toDto(equipment);

            // Get all equipment on the same P&ID for shape overlays
            List<EquipmentDto> equipmentOnPid = List.of();
            if (equipment.getMainFile() != null) {
                equipmentOnPid = equipmentRepo.findByMainFile_Id(equipment.getMainFile().getId())
                        .stream()
                        .map(ngEquipmentService::toDto)
                        .toList();
            }

            // Build response — Map.of is immutable, so use a HashMap so we
            // can conditionally include the warning entry only when needed.
            java.util.Map<String, Object> result = new java.util.LinkedHashMap<>();
            result.put("target", targetDto);
            result.put("equipmentOnPid", equipmentOnPid);

            String responseMessage = "Equipment found";
            if (matches.size() > 1) {
                List<Long> allIds = matches.stream().map(Equipment::getId).toList();
                String warning = "Tag '" + tagNumber + "' matches " + matches.size()
                        + " active Equipment rows (ids: " + allIds + "). "
                        + "Showing id=" + equipment.getId() + " (lowest). "
                        + "Fix the data by renaming duplicates or adding a unique constraint.";
                result.put("warning", warning);
                result.put("duplicateIds", allIds);
                responseMessage = "Equipment found (ambiguous tag)";
                log.error("[QR] AMBIGUOUS tag lookup: tagNumber={}, matchCount={}, ids={}",
                        tagNumber, matches.size(), allIds);
            } else {
                log.info("[QR] Equipment lookup: tagNumber={}, found=true, id={}",
                        tagNumber, equipment.getId());
            }
            return ResponseEntity.ok(new NgApiResponse<>(result, responseMessage));
        } catch (Exception e) {
            log.error("[QR] Equipment lookup failed: tagNumber={}, error={}", tagNumber, e.getMessage(), e);
            return ResponseEntity.badRequest()
                    .body(new NgApiResponse<>(null, "Lookup failed: " + e.getMessage()));
        }
    }
}
