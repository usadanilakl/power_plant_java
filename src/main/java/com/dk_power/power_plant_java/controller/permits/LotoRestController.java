package com.dk_power.power_plant_java.controller.permits;

import com.dk_power.power_plant_java.entities.loto.Loto;
import com.dk_power.power_plant_java.sevice.loto.LotoBuilderService;
import com.dk_power.power_plant_java.sevice.loto.LotoService;
import lombok.AllArgsConstructor;
import org.python.antlr.ast.Str;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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
    @GetMapping("/build-loto")
    public ResponseEntity<String> buildLoto(){
        List<String> tags = new ArrayList<>();
        tags.add("01-VAXS147");
        tags.add("01-VAXS165");
        tags.add("01-VAXS168");
        tags.add("01-VAXS147");
        LotoBuilderService.buildLoto(tags);
        return ResponseEntity.ok("Success");
    }
}
