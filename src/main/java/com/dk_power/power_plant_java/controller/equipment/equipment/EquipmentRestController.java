package com.dk_power.power_plant_java.controller.equipment.equipment;

import com.dk_power.power_plant_java.dto.equipment.EquipmentDto;
import com.dk_power.power_plant_java.entities.equipment.Equipment;
import com.dk_power.power_plant_java.sevice.equipment.EquipmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/eq-api")
@RequiredArgsConstructor
public class EquipmentRestController {
    private final EquipmentService equipmentService;
    @GetMapping("/")
    public ResponseEntity<List<EquipmentDto>> getAllEquipment(){
        return ResponseEntity.ok(equipmentService.getAllDtos());
    }
    @GetMapping("/{id}")
    public ResponseEntity<EquipmentDto> getSingleEquipment(@PathVariable String id){
        return ResponseEntity.ok(equipmentService.getDtoById(id));
    }
    @PostMapping("/")
    public ResponseEntity<EquipmentDto> createNewEquipment(@RequestBody EquipmentDto eq){
        return ResponseEntity.ok(equipmentService.convertToDto(equipmentService.save(eq)));
    }
    @PutMapping("/")
    public ResponseEntity<EquipmentDto> updateEquipment(@RequestBody EquipmentDto eq){
        if(equipmentService.getEntityById(eq.getId())!=null) {
            return ResponseEntity.ok(equipmentService.convertToDto(equipmentService.save(eq)));
        }else{
            throw new RuntimeException("Equipment now found");
        }
    }
    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteEquipment(@PathVariable String id){
        if(equipmentService.getEntityById(id)!=null) {
            equipmentService.softDelete(id);
            return ResponseEntity.ok("Item was deleted successfully");
        }else{
            throw new RuntimeException("Equipment now found");
        }
    }
    @PatchMapping("/tag/{id}/{tag}")
    public ResponseEntity<String> updateTag(@PathVariable String id, @PathVariable String tag){
        Equipment entity = equipmentService.getEntityById(id);
        entity.setTagNumber(tag);
        equipmentService.save(entity);
        return ResponseEntity.ok("Tag Number was successfully updated");
    }
}
