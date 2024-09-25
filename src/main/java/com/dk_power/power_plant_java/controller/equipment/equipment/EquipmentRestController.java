package com.dk_power.power_plant_java.controller.equipment.equipment;

import com.dk_power.power_plant_java.dto.equipment.EquipmentDto;
import com.dk_power.power_plant_java.entities.equipment.Equipment;
import com.dk_power.power_plant_java.sevice.data_transfer.JsonWriterService;
import com.dk_power.power_plant_java.sevice.equipment.EquipmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/eq-api")
@RequiredArgsConstructor
public class EquipmentRestController {
    private final EquipmentService equipmentService;
    private final JsonWriterService jsonWriterService;
    @GetMapping("/")
    public ResponseEntity<List<EquipmentDto>> getAllEquipment(){
        return ResponseEntity.ok(equipmentService.getAll().stream().map(e->equipmentService.getMapper().convertToDtoLight(e)).toList());
    }
    @GetMapping("/{id}")
    public ResponseEntity<EquipmentDto> getSingleEquipment(@PathVariable String id){
        return ResponseEntity.ok(equipmentService.getDtoById(id));
    }
    @PostMapping("/")
    public ResponseEntity<EquipmentDto> createNewEquipment(@RequestBody EquipmentDto eq){
        System.out.println(eq.getIsUpdated());
        Equipment saved = equipmentService.save(eq);
        EquipmentDto equipmentDto = equipmentService.convertToDto(saved);
        if(eq.getIsUpdated()!=null)jsonWriterService.writeJsonFile("updates/"+eq.getIsUpdated()+".json",equipmentDto);
        return ResponseEntity.ok(equipmentDto);
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

        System.out.println(eq.getSystem());
        Equipment entity = equipmentService.getEntityById(eq.getId());
        if(entity!=null){
            Equipment saved = equipmentService.save(eq);
            System.out.println("saved: " + eq.getId() + ", " + saved.getTagNumber());
            saved.getLotoPoints().forEach(e-> System.out.println(e.getNormPos()));
            return ResponseEntity.ok("Tag Number was successfully updated");
        }
        else return ResponseEntity.ok("Equipment wasn't found");

    }

    @GetMapping("/search/{value}")
    public ResponseEntity<List<EquipmentDto>> searchEqPoint(@PathVariable String value){
        value = value.trim().toLowerCase();
        Set<Equipment> result = new LinkedHashSet<>();
        List<Equipment> searchByTag = equipmentService.getIfTagNumberContains(value);
        List<Equipment> searchByDescription = equipmentService.getIfDescriptionContains(value);

        if(searchByTag!=null && searchByTag.size()>0) result.addAll(searchByTag);
        if(searchByDescription!=null && searchByDescription.size()>0) result.addAll(searchByDescription);

        return ResponseEntity.ok(result.stream().map(equipmentService::convertToDto).toList());
    }
}
