package com.dk_power.power_plant_java.controller.points;

import com.dk_power.power_plant_java.dto.equipment.EquipmentDto;
import com.dk_power.power_plant_java.entities.equipment.Equipment;
import com.dk_power.power_plant_java.sevice.equipment.EquipmentService;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/points")
@AllArgsConstructor
public class PointRestController {
    private final EquipmentService equipmentService;
    @PostMapping("/create")
    public List<Equipment> createPoints(@RequestBody List<Equipment> points){
        for (Equipment point : points) {
            equipmentService.save(point);
        }
        return points;
    }
    @GetMapping("/get-point/{id}")
    public ResponseEntity<EquipmentDto> getPoint(@PathVariable String id){
        return ResponseEntity.ok(equipmentService.getDtoById(id));
    }
    @PatchMapping("/")
    public ResponseEntity<EquipmentDto> updateEquipment(@PathVariable String id, @RequestBody EquipmentDto dto){
        Equipment equipment = equipmentService.convertToEntity(dto);
        Equipment update = equipmentService.update(equipment);
        return ResponseEntity.ok(equipmentService.convertToDto(update));
    }
}
