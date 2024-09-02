package com.dk_power.power_plant_java.controller.permits;

import com.dk_power.power_plant_java.dto.permits.LotoPointDto;
import com.dk_power.power_plant_java.dto.permits.LotoPointDtoLight;
import com.dk_power.power_plant_java.entities.loto.LotoPoint;
import com.dk_power.power_plant_java.sevice.loto.loto_point.LotoPointService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/loto-points-api")
@RequiredArgsConstructor
public class LotoPointRestController {
    private final LotoPointService lotoPointService;
    @GetMapping("/")
    public ResponseEntity<List<LotoPointDtoLight>> getAllRivisedPoint(){
        return ResponseEntity.ok(lotoPointService.getAllLight());
    }
    @GetMapping("/old-id/{oldId}")
    public ResponseEntity<LotoPointDto> getLotoPointByOldId(@PathVariable String oldId){
        return ResponseEntity.ok(lotoPointService.convertToDto(lotoPointService.getByOldId(oldId)));
    }
    @GetMapping("/{id}")
    public ResponseEntity<LotoPointDto> getLotoPointById(@PathVariable String id){
        return ResponseEntity.ok(lotoPointService.getDtoById(id));
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
    @PostMapping("/")
    public ResponseEntity<LotoPointDto> createNew(@RequestBody LotoPointDto dto){
        return ResponseEntity.ok(lotoPointService.convertToDto(lotoPointService.save(dto)));
    }
    @GetMapping("/tag/{tag}")
    public ResponseEntity<List<LotoPointDto>> getLotoPointByTag(@PathVariable String tag){
        return ResponseEntity.ok(lotoPointService.getByTagNumber(tag));
    }
    @GetMapping("/tag-in-description/{tag}")
    public ResponseEntity<List<LotoPointDto>> getLotoPointByTagInDescription(@PathVariable String tag){
        return ResponseEntity.ok(lotoPointService.getByTagNumberInDescription(tag));
    }

    @GetMapping("/tag-and-tag-in-description/{tag}")
    public ResponseEntity<List<LotoPointDto>> getLotoPointByTagAndTagInDescription(@PathVariable String tag){
        List<LotoPointDto> list = new ArrayList<>();
        List<LotoPointDto> byTagInDescription = lotoPointService.getByTagNumberInDescription(tag);
        List<LotoPointDto> byTag = lotoPointService.getByTagNumber(tag);
        if(byTag!=null)list.addAll(byTag);
        if(byTagInDescription!=null)list.addAll(byTagInDescription);
        return ResponseEntity.ok(list);
    }


}
