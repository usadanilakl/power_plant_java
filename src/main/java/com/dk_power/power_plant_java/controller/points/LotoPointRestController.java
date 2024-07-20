package com.dk_power.power_plant_java.controller.points;

import com.dk_power.power_plant_java.entities.loto.LotoPoint;
import com.dk_power.power_plant_java.sevice.equipment.LotoPointService;
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
    public ResponseEntity<List<LotoPoint>> getAllRivisedPoint(){
        return ResponseEntity.ok(lotoPointService.getAll());
}


}
