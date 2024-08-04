package com.dk_power.power_plant_java.controller.permits;

import com.dk_power.power_plant_java.dto.permits.LotoPointDto;
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


}
