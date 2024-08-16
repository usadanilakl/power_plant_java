package com.dk_power.power_plant_java.controller.equipment.heat_trace;


import com.dk_power.power_plant_java.dto.equipment.HeatTraceDto;
import com.dk_power.power_plant_java.sevice.equipment.HeatTraceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/ht-api")
@RequiredArgsConstructor
public class HeatTraceRestController {
    private final HeatTraceService heatTraceService;
    @GetMapping("/")
    public ResponseEntity<List<HeatTraceDto>> getAllHts(){
        return ResponseEntity.ok(heatTraceService.getAllDtos());
    }
    @GetMapping("/{id}")
    public ResponseEntity<HeatTraceDto> getSingleHt(@PathVariable String id){
        return ResponseEntity.ok(heatTraceService.getDtoById(id));
    }
    @PostMapping("/")
    public ResponseEntity<HeatTraceDto> createNewHt(@RequestBody HeatTraceDto eq){
        return ResponseEntity.ok(heatTraceService.convertToDto(heatTraceService.save(eq)));
    }
    @PutMapping("/")
    public ResponseEntity<HeatTraceDto> updateHt(@RequestBody HeatTraceDto eq){
        if(heatTraceService.getEntityById(eq.getId())!=null) {
            return ResponseEntity.ok(heatTraceService.convertToDto(heatTraceService.save(eq)));
        }else{
            throw new RuntimeException("Equipment now found");
        }
    }
    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteHt(@PathVariable String id){
        if(heatTraceService.getEntityById(id)!=null) {
            heatTraceService.softDelete(id);
            return ResponseEntity.ok("Item was deleted successfully");
        }else{
            throw new RuntimeException("Equipment now found");
        }
    }
}
