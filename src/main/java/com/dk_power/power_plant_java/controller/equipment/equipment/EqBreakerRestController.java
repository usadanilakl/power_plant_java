package com.dk_power.power_plant_java.controller.equipment.equipment;

import com.dk_power.power_plant_java.dto.equipment.EqBreakerDto;
import com.dk_power.power_plant_java.sevice.equipment.EqBreakerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/eq-breaker-api")
public class EqBreakerRestController {
    private final EqBreakerService eqBreakerService;
    @GetMapping("/")
    public ResponseEntity<List<EqBreakerDto>> getAllBreakers(){
        return ResponseEntity.ok(eqBreakerService.getAllDtos());
    }
    @GetMapping("/{id}")
    public ResponseEntity<EqBreakerDto> getSingleBreaker(@PathVariable String id){
        return ResponseEntity.ok(eqBreakerService.getDtoById(id));
    }
    @PostMapping("/")
    public ResponseEntity<EqBreakerDto> createNewBreaker(@RequestBody EqBreakerDto eq){
        return ResponseEntity.ok(eqBreakerService.convertToDto(eqBreakerService.save(eq)));
    }
    @PutMapping("/")
    public ResponseEntity<EqBreakerDto> updateBreaker(@RequestBody EqBreakerDto eq){
        if(eqBreakerService.getEntityById(eq.getId())!=null) {
            return ResponseEntity.ok(eqBreakerService.convertToDto(eqBreakerService.save(eq)));
        }else{
            throw new RuntimeException("Breaker now found");
        }
    }
    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteBreaker(@PathVariable String id){
        if(eqBreakerService.getEntityById(id)!=null) {
            eqBreakerService.softDelete(id);
            return ResponseEntity.ok("Item was deleted successfully");
        }else{
            throw new RuntimeException("Breaker now found");
        }
    }
}
