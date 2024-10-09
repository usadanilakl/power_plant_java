package com.dk_power.power_plant_java.controller.category;

import com.dk_power.power_plant_java.dto.base_dtos.BaseDto;
import com.dk_power.power_plant_java.dto.categories.ValueDto;
import com.dk_power.power_plant_java.entities.categories.Value;
import com.dk_power.power_plant_java.sevice.categories.ValueService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/values")
public class ValueRestController {
    private final ValueService valueService;
    @DeleteMapping("/{id}")
    public ResponseEntity<Object> deleteValue(@PathVariable String id){
        Value entity = valueService.getEntityById(id);
        Collection<BaseDto> baseDtos = valueService.delVal(entity);
        Map<String,Object> resp = new HashMap<>();
        resp.put("list",baseDtos);
        resp.put("oldValue",id);
        resp.put("action", "reassign");
        resp.put("categoryAlias",entity.getCategory().getAlias());
        return ResponseEntity.ok(resp);
    }
    @DeleteMapping("/{oldId}/{newId}")
    public ResponseEntity<Object> deleteValueWithRefactor(@PathVariable String oldId,@PathVariable String newId){
        System.out.println(oldId + newId);
        valueService.refactor(valueService.getEntityById(oldId),valueService.getEntityById(newId));
        Collection<BaseDto> baseDtos = valueService.delVal(valueService.getEntityById(oldId));
        String resp = (baseDtos.isEmpty())? "Success" : "Failed";
        return ResponseEntity.ok(resp+" deleting " + oldId);
    }
    @PatchMapping("/{oldId}/{newId}")
    public ResponseEntity<String> refactorValue(@PathVariable String oldId,@PathVariable String newId){
        valueService.refactor(valueService.getEntityById(oldId),valueService.getEntityById(newId));
        return ResponseEntity.ok("Success");
    }
    @GetMapping("/")
    public ResponseEntity<List<ValueDto>> getAllValues(){
        return ResponseEntity.ok(valueService.getAll().stream().map(valueService::convertToDto).toList());
    }
}
