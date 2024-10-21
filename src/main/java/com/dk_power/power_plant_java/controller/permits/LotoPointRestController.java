package com.dk_power.power_plant_java.controller.permits;

import com.dk_power.power_plant_java.dto.permits.LotoPointDto;
import com.dk_power.power_plant_java.dto.permits.LotoPointDtoLight;
import com.dk_power.power_plant_java.entities.equipment.Equipment;
import com.dk_power.power_plant_java.entities.files.FileObject;
import com.dk_power.power_plant_java.entities.loto.LotoPoint;
import com.dk_power.power_plant_java.sevice.file.FileService;
import com.dk_power.power_plant_java.sevice.loto.loto_point.LotoPointMergeService;
import com.dk_power.power_plant_java.sevice.loto.loto_point.LotoPointService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/loto-points-api")
@RequiredArgsConstructor
public class LotoPointRestController {
    private final LotoPointService lotoPointService;
    private final LotoPointMergeService lotoPointMergeService;
    private final FileService fileService;
    @GetMapping("/")
    public ResponseEntity<List<LotoPointDtoLight>> getAllRivisedPoint(){
        return ResponseEntity.ok(lotoPointService.getAllLight());
    }
    @GetMapping("/all")
    public ResponseEntity<List<LotoPointDto>> getAllLotoPoints(){
        System.out.println("Getting all loto points");
        return ResponseEntity.ok(lotoPointService.getAll().stream().map(lotoPointService::convertToDto).toList());
    }
    @DeleteMapping("/{id}")
    public ResponseEntity<String> getAllRivisedPoint(@PathVariable String id){
        LotoPoint obj = lotoPointService.getEntityById(id);
        Long objId = obj.getId();
        lotoPointService.softDelete(obj);
        return ResponseEntity.ok("Success deleting"+objId);
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
        System.out.println(dto.getTagNumber());
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

    @GetMapping("/match-points/{id}")
    public ResponseEntity<List<Map<String,Object>>> matchPoints(@PathVariable String id){

        FileObject file = fileService.getEntityById(id);
        Set<LotoPointDto> items = new HashSet<>();
        file.getPoints().forEach(e->{
            List<LotoPointDto> list = e.getLotoPoints().stream().map(lotoPointService::convertToDto).toList();
            items.addAll(list);
        });

        List<Map<String,Object>> result = new ArrayList<>();
        Set<Long> ids = new HashSet<>();
        for (LotoPointDto item : items) {
            Map<String, Object> matched = lotoPointMergeService.copyPointFromOtherUnit(item.getId());
            if(matched==null) continue;
            if(!ids.addAll((Set<Long>)matched.get("Ids"))) continue;
            List<LotoPointDto> list = ((List<LotoPoint>) matched.get("Match")).stream().map(lotoPointService::convertToDto).toList();
            matched.put("Match",list);
            matched.put("Original",lotoPointService.convertToDto((LotoPoint)matched.get("Original")));
            result.add(matched);
        }
        return ResponseEntity.ok(result);
    }

    @GetMapping("/project-status")
    public ResponseEntity<Map<String,String>> getProjectStatus(){
        int all = lotoPointService.getAll().size();
        int completed = lotoPointService.getAll().stream().filter(e -> e.getDateModified().isAfter(LocalDateTime.of(2024, 8, 6, 00, 00))).toList().size();

        int complPids = fileService.getCompletedPids().size();
        int allPids = fileService.getIncompletePids().stream().filter(e -> e.getFileType().getName().equalsIgnoreCase("pid")).toList().size();

        Map<String,String> result = new HashMap<>();
        result.put("lotoPoints","LOTO Points: Processed-"+completed+"/total-" + all);
        result.put("pids","PID:Processed-"+complPids+"/total-" + allPids);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/get-active-points")
    public ResponseEntity<List<LotoPointDto>> getActiveLotoPoints(){
//        return ResponseEntity.ok(lotoPointService.getActiveNotVerifiedLotoPoints());
        return ResponseEntity.ok(lotoPointService.getActiveLotoPoints());
    }

    @PutMapping("/")
    public ResponseEntity<String> updateNonNullFields(@RequestBody LotoPointDto lp){
        lotoPointService.save(lp);
        return ResponseEntity.ok("Success");
    }

    @PostMapping("/by-tag-by-unit/{unit}")
    public ResponseEntity<Set<LotoPointDto>> getPointsByTagByUnit(@RequestBody List<String> tags,@PathVariable String unit){
        Set<LotoPointDto> result = new HashSet<>();
        tags.forEach(e -> {
            if ((e.trim().startsWith("01") && unit.equalsIgnoreCase("02")) ||
                    (e.trim().startsWith("02") && unit.equalsIgnoreCase("01")))
            {
                List<LotoPointDto> byTagNumber = lotoPointService.getByTagNumber(unit + e.substring(2).trim());
                byTagNumber.forEach(el->{
                    if(!result.stream().map(id->id.getId()).toList().contains(el.getId())) result.add(el);
                });
            } else
            {
                List<LotoPointDto> byTagNumber = lotoPointService.getByTagNumber(e.trim());
                byTagNumber.forEach(el->{
                    if(!result.stream().map(id->id.getId()).toList().contains(el.getId())) result.add(el);
                });
            }
        });
        return ResponseEntity.ok(result);
    }


}
