package com.dk_power.power_plant_java.controller.equipment.heat_trace;

import com.dk_power.power_plant_java.dto.equipment.HtPanelDto;
import com.dk_power.power_plant_java.sevice.equipment.HtPanelService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/ht-panel-api")
public class HtPanelRestController {
    private final HtPanelService htPanelService;
    @GetMapping("/")
    public ResponseEntity<List<HtPanelDto>> getAllPanels(){
        return ResponseEntity.ok(htPanelService.getAllDtos());
    }
    @GetMapping("/{id}")
    public ResponseEntity<HtPanelDto> getSinglePanel(@PathVariable String id){
        return ResponseEntity.ok(htPanelService.getDtoById(id));
    }
    @PostMapping("/")
    public ResponseEntity<HtPanelDto> createNewPanel(@RequestBody HtPanelDto eq){
        return ResponseEntity.ok(htPanelService.convertToDto(htPanelService.save(eq)));
    }
    @PutMapping("/")
    public ResponseEntity<HtPanelDto> updatePanel(@RequestBody HtPanelDto eq){
        if(htPanelService.getEntityById(eq.getId())!=null) {
            return ResponseEntity.ok(htPanelService.convertToDto(htPanelService.save(eq)));
        }else{
            throw new RuntimeException("Breaker now found");
        }
    }
    @DeleteMapping("/{id}")
    public ResponseEntity<String> deletePanel(@PathVariable String id){
        if(htPanelService.getEntityById(id)!=null) {
            htPanelService.softDelete(id);
            return ResponseEntity.ok("Item was deleted successfully");
        }else{
            throw new RuntimeException("Breaker now found");
        }
    }
}
