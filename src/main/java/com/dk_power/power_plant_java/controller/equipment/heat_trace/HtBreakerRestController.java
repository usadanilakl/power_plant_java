package com.dk_power.power_plant_java.controller.equipment.heat_trace;

import com.dk_power.power_plant_java.dto.equipment.HtBreakerDto;
import com.dk_power.power_plant_java.sevice.equipment.HtBreakerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/ht-breaker-api")
public class HtBreakerRestController {
    private final HtBreakerService htBreakerService;
    @GetMapping("/")
    public ResponseEntity<List<HtBreakerDto>> getAllBreakers(){
        return ResponseEntity.ok(htBreakerService.getAllDtos());
    }
    @GetMapping("/{id}")
    public ResponseEntity<HtBreakerDto> getSingleBreaker(@PathVariable String id){
        return ResponseEntity.ok(htBreakerService.getDtoById(id));
    }
    @PostMapping("/")
    public ResponseEntity<HtBreakerDto> createNewBreaker(@RequestBody HtBreakerDto eq){
        return ResponseEntity.ok(htBreakerService.convertToDto(htBreakerService.save(eq)));
    }
    @PutMapping("/")
    public ResponseEntity<HtBreakerDto> updateBreaker(@RequestBody HtBreakerDto eq){
        if(htBreakerService.getEntityById(eq.getId())!=null) {
            return ResponseEntity.ok(htBreakerService.convertToDto(htBreakerService.save(eq)));
        }else{
            throw new RuntimeException("Breaker now found");
        }
    }
    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteBreaker(@PathVariable String id){
        if(htBreakerService.getEntityById(id)!=null) {
            htBreakerService.softDelete(id);
            return ResponseEntity.ok("Item was deleted successfully");
        }else{
            throw new RuntimeException("Breaker now found");
        }
    }
}
