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
    @PatchMapping("/")
    public ResponseEntity<String> updateTag(@RequestBody EquipmentDto eq){
        Equipment entity = equipmentService.getEntityById(eq.getId());
        if(entity!=null){
            Equipment saved = equipmentService.save(eq);
            System.out.println("saved: " + eq.getId() + ", " + saved.getTagNumber());
            System.out.println(saved.getLocation());
            return ResponseEntity.ok("Tag Number was successfully updated");
        }
        else return ResponseEntity.ok("Equipment wasn't found");

    }
}
