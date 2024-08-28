package com.dk_power.power_plant_java.controller.points;

import com.dk_power.power_plant_java.dto.equipment.EquipmentDto;
import com.dk_power.power_plant_java.entities.equipment.Equipment;
import com.dk_power.power_plant_java.entities.loto.LotoPoint;
import com.dk_power.power_plant_java.sevice.equipment.EquipmentService;
import com.dk_power.power_plant_java.sevice.loto.LotoPointService;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/points")
@AllArgsConstructor
public class PointRestController {
    private final EquipmentService equipmentService;
    private final LotoPointService lotoPointService;
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
    @GetMapping("/get-point-by-tag/{tag}")
    public ResponseEntity<List<EquipmentDto>> getPointByTag(@PathVariable String tag){
        return ResponseEntity.ok(equipmentService.getByTagNumber(tag).stream().map(equipmentService::convertToDto).toList());
    }
    @PatchMapping("/")
    public ResponseEntity<EquipmentDto> updateEquipment(@PathVariable String id, @RequestBody EquipmentDto dto){
        Equipment equipment = equipmentService.convertToEntity(dto);
        Equipment update = equipmentService.update(equipment);
        return ResponseEntity.ok(equipmentService.convertToDto(update));
    }
    @PostMapping("/")
    public ResponseEntity<EquipmentDto> createEquipment(@RequestBody EquipmentDto dto){
        System.out.println(dto);
        Equipment save = equipmentService.save(dto);
        return ResponseEntity.ok(equipmentService.convertToDto(save));
    }
    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteEquipment(@PathVariable String id){
        Equipment entity = equipmentService.getEntityById(id);
        equipmentService.softDelete(entity);
        System.out.println("Point: " + id +" was deleted");
        return ResponseEntity.ok("Point: " + id +" was deleted");
    }

    @PutMapping("/add-loto-point/{eq}/{point}")
    public ResponseEntity<EquipmentDto> addLotoPointEquipment(@PathVariable String eq, @PathVariable String point){
        System.out.println(eq + " " +point);
        Equipment equipment = equipmentService.getEntityById(eq);
        LotoPoint update = lotoPointService.getByOldId(point);
        equipment.addLotoPoint(update);
        update.addEquipment(equipment);
        Equipment updated = equipmentService.update(equipment);
        System.out.println(updated.getLotoPoints());
        return ResponseEntity.ok(equipmentService.convertToDto(updated));
    }
}
