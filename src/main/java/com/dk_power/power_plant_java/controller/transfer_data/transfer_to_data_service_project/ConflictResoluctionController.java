package com.dk_power.power_plant_java.controller.transfer_data.transfer_to_data_service_project;

import com.dk_power.power_plant_java.dto.equipment.EquipmentDto;
import com.dk_power.power_plant_java.dto.permits.LotoPointDto;
import com.dk_power.power_plant_java.entities.Conflict;
import com.dk_power.power_plant_java.entities.equipment.Equipment;
import com.dk_power.power_plant_java.entities.loto.LotoPoint;
import com.dk_power.power_plant_java.sevice.data_transfer.transfer_to_data_service_project.FileElementTransferService;
import com.dk_power.power_plant_java.sevice.equipment.impl.EquipmentServiceImpl;
import com.dk_power.power_plant_java.sevice.loto.loto_point.LotoPointServiceImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/conflict")
public class ConflictResoluctionController {

    private final FileElementTransferService fileElementTransferService;
    private final EquipmentServiceImpl equipmentService;
    private final LotoPointServiceImpl lotoPointService;

    @GetMapping("/equipment/{conflict}")
    public ResponseEntity<List<EquipmentDto>> getEquipmentConflicts(@PathVariable Conflict.ConflictType conflict) {
        List<Equipment> conflictingEquipment = fileElementTransferService.getConflictingEquipment(conflict);
        return ResponseEntity.ok(conflictingEquipment.stream().map(equipmentService::convertToDto).toList());
    }

    @GetMapping("/loto-point/{conflict}")
    public ResponseEntity<List<LotoPointDto>> getLotoPointConflicts(@PathVariable String conflict) {
        List<LotoPoint> conflictingEquipment = fileElementTransferService.getConflictingLotoPoints(conflict);
        return ResponseEntity.ok(conflictingEquipment.stream().map(lotoPointService::convertToDto).toList());
    }

    @PostMapping("/update-equipment/{conflict}")
    public ResponseEntity<EquipmentDto> updateEquipment(@RequestBody EquipmentDto dto, @PathVariable Conflict.ConflictType conflict){
        Equipment equipment = equipmentService.convertToEntity(dto);
        Equipment update = equipmentService.update(equipment);
        fileElementTransferService.resolveConflict(conflict,update.getId().toString());
        return ResponseEntity.ok(equipmentService.convertToDto(update));
    }

    @PostMapping("/update-loto-point/{conflict}")
    public ResponseEntity<LotoPointDto> updateLotoPoint(@RequestBody LotoPointDto dto, @PathVariable Conflict.ConflictType conflict){
        LotoPoint lotoPoint = lotoPointService.convertToEntity(dto);
        LotoPoint update = lotoPointService.save(lotoPoint);
        return ResponseEntity.ok(lotoPointService.convertToDto(update));
    }
}
