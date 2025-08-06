package com.dk_power.power_plant_java.controller.browser;

import com.dk_power.power_plant_java.dto.browser.BrLotoPoint;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/browser/loto")
public class BrLotoController {
    @PostMapping("/build-red-tag-loto")
    public ResponseEntity<String> buildRedTagLoto(@RequestBody List<BrLotoPoint> points){
        System.out.println(points);
//        LotoBuilderService.buildRedTagLoto(points);
        return ResponseEntity.ok("Success");
    }
}
