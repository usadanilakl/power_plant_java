package com.dk_power.power_plant_java.controller.equipment.equipment;

import com.dk_power.power_plant_java.dto.equipment.ElectricalPanelDto;
import com.dk_power.power_plant_java.sevice.equipment.ElectricalPanelService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
@RestController
@RequiredArgsConstructor
@RequestMapping("/el-panel-api")
public class ElectricalPanelRestController {
    private final ElectricalPanelService electricalPanelService;
    @GetMapping("/")
    public ResponseEntity<List<ElectricalPanelDto>> getAllPanels(){
        return ResponseEntity.ok(electricalPanelService.getAllDtos());
    }
    @GetMapping("/{id}")
    public ResponseEntity<ElectricalPanelDto> getSinglePanel(@PathVariable String id){
        return ResponseEntity.ok(electricalPanelService.getDtoById(id));
    }
    @PostMapping("/")
    public ResponseEntity<ElectricalPanelDto> createNewPanel(@RequestBody ElectricalPanelDto eq){
        return ResponseEntity.ok(electricalPanelService.convertToDto(electricalPanelService.save(eq)));
    }
    @PutMapping("/")
    public ResponseEntity<ElectricalPanelDto> updatePanel(@RequestBody ElectricalPanelDto eq){
        if(electricalPanelService.getEntityById(eq.getId())!=null) {
            return ResponseEntity.ok(electricalPanelService.convertToDto(electricalPanelService.save(eq)));
        }else{
            throw new RuntimeException("Breaker now found");
        }
    }
    @DeleteMapping("/{id}")
    public ResponseEntity<String> deletePanel(@PathVariable String id){
        if(electricalPanelService.getEntityById(id)!=null) {
            electricalPanelService.softDelete(id);
            return ResponseEntity.ok("Item was deleted successfully");
        }else{
            throw new RuntimeException("Breaker now found");
        }
    }
}
