package com.dk_power.power_plant_java.controller.permits;

import com.dk_power.power_plant_java.entities.loto.Loto;
import com.dk_power.power_plant_java.sevice.loto.LotoBuilderService;
import com.dk_power.power_plant_java.sevice.loto.LotoService;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api-lotos")
@AllArgsConstructor
public class LotoRestController {
    private final LotoService tempLotoService;
//    private final LotoBuilderService lotoBuilderService;
    @GetMapping("/get-temp")
    public ResponseEntity<Loto> getTempLoto(){
        Loto tempPermit = tempLotoService.getTempPermit();
        return ResponseEntity.ok(tempPermit);
    }
    @PostMapping("/build-loto")
    public ResponseEntity<String> buildLoto(@RequestBody List<String> tags){
        System.out.println(tags);
        LotoBuilderService.buildLoto(tags);
        return ResponseEntity.ok("Success");
    }
}
