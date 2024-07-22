package com.dk_power.power_plant_java.controller.category;

import com.dk_power.power_plant_java.sevice.categories.ValueService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/values")
public class ValueRestController {
    private final ValueService valueService;
    @DeleteMapping("/{id}")
    public ResponseEntity<Object> deleteValue(@PathVariable String id){
        return ResponseEntity.ok(valueService.deleteValue(valueService.getEntityById(id)));
    }
    @PatchMapping("/{oldId}/{newId}")
    public ResponseEntity<String> deleteValue(@PathVariable String oldId,@PathVariable String newId){
        valueService.refractorIsoPosValue(valueService.getEntityById(oldId),valueService.getEntityById(newId));
        return ResponseEntity.ok("Success");
    }
}
