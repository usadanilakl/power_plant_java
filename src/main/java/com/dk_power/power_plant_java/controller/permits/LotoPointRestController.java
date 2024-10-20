package com.dk_power.power_plant_java.controller.permits;

import com.dk_power.power_plant_java.dto.permits.LotoPointDto;
import com.dk_power.power_plant_java.entities.loto.LotoPoint;
import com.dk_power.power_plant_java.sevice.loto.LotoPointService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/loto-points-api/")
@RequiredArgsConstructor
public class LotoPointRestController {
    private final LotoPointService lotoPointService;
    @GetMapping("/")
    public ResponseEntity<List<LotoPointDto>> getAllRivisedPoint(){
        return ResponseEntity.ok(lotoPointService.getAllDtos());
    }
    @GetMapping("/old-id/{oldId}")
    public ResponseEntity<LotoPointDto> getLotoPointByOldId(@PathVariable String oldId){
        return ResponseEntity.ok(lotoPointService.convertToDto(lotoPointService.getByOldId(oldId)));
    }
    @GetMapping("/empty")
    public ResponseEntity<LotoPointDto> getEmptyLotoPointDto(){
        return ResponseEntity.ok(new LotoPointDto());
    }
    @PatchMapping("/")
    public ResponseEntity<String> updateLotoPointPartually(@RequestBody LotoPointDto dto){
        LotoPoint entity = lotoPointService.getEntityById(dto.getId());
        if(entity == null) return ResponseEntity.ok("Loto Point is not found");
        else return ResponseEntity.ok(lotoPointService.save(dto).getTagNumber() + " was successfully saved - ");
    }
    @GetMapping("/tag/{tag}")
    public ResponseEntity<List<LotoPointDto>> getLotoPointByTag(@PathVariable String tag){
        return ResponseEntity.ok(lotoPointService.getByTagNumber(tag));
    }


}
