package com.dk_power.power_plant_java.controller.browser;

import com.azure.core.annotation.Get;
import com.dk_power.power_plant_java.dto.browser.BrLotoPoint;
import com.dk_power.power_plant_java.dto.browser.BrLotoStandard;
import com.dk_power.power_plant_java.sevice.browser.BrLotoService;
import com.dk_power.power_plant_java.sevice.loto.LotoBuilderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/browser/loto")
@RequiredArgsConstructor
public class BrLotoController {
    private final BrLotoService lotoService;


    @PostMapping("/build-red-tag-loto")
    public ResponseEntity<String> buildRedTagLoto(@RequestBody List<BrLotoPoint> points){
//        System.out.println(points);
        LotoBuilderService.buildRedTagLoto(points);
        return ResponseEntity.ok("Success");
    }

    @PostMapping("/create-standard")
    public ResponseEntity<BrLotoStandard> createLotoStandard(@RequestBody BrLotoStandard standard){
        try{
            BrLotoStandard saved = lotoService.createStandard(standard);
            return ResponseEntity.ok(saved);
        }catch (Exception e){
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(null);
        }
    }

    @GetMapping("/get-all")
    public ResponseEntity<List<BrLotoStandard>> getAllLotoStandards(){
        try{
            return ResponseEntity.ok(lotoService.getAll());
        }catch (Exception e){
            return ResponseEntity.internalServerError().body(null);
        }
    }

    @GetMapping("/get-standard-points")
    public ResponseEntity<List<BrLotoPoint>> getStandardPoints(Long standardId){
        try{
            return ResponseEntity.ok(lotoService.getStandardPoints(standardId));
        }catch (Exception e){
            return ResponseEntity.internalServerError().body(null);
        }
    }
}
